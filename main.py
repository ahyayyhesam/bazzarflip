from flask import Flask, render_template, jsonify
import requests
from datetime import datetime

app = Flask(__name__)

MIN_FLIP_PRICE = 100
MAX_FLIP_PRICE = 500000
MIN_FLIP_VOLUME = 100000
MIN_CRAFT_PROFIT = 0
BAZAAR_TAX = 0.00


CRAFT_RECIPES = {
    # example: "ENCHANTED_DIAMOND": {"materials": {"DIAMOND": 160}, "amount": 1},
}

def fetch_bazaar_data():
    try:
        response = requests.get("https://api.hypixel.net/skyblock/bazaar", timeout=10)
        data = response.json()
        return data.get('products', {}) if data.get('success') else {}
    except Exception as e:
        print(f"API Error: {e}")
        return {}

def calculate_flip_profits(products):
    flips = []
    for item_id, data in products.items():
        buy_orders = data.get('buy_summary', [])
        sell_orders = data.get('sell_summary', [])
        
        if not buy_orders or not sell_orders:
            continue
            
        buy_price = sell_orders[0]['pricePerUnit']
        sell_price = buy_orders[0]['pricePerUnit']
        profit = (sell_price * (1 - BAZAAR_TAX)) - buy_price
        margin = (profit / buy_price) * 100 if buy_price > 0 else 0
        
        status = data.get('quick_status', {})
        volume = min(status.get('buyMovingWeek', 0), status.get('sellMovingWeek', 0))
        
        if (MIN_FLIP_PRICE <= buy_price <= MAX_FLIP_PRICE and
            volume >= MIN_FLIP_VOLUME):
            
            flips.append({
                "name": item_id.replace("_", " ").title(),
                "type": "flip",
                "cost": buy_price,
                "sell": sell_price,
                "profit": profit,
                "margin": margin,
                "volume": volume,
                "potential": profit * (volume // 1000)
            })
    
    return sorted(flips, key=lambda x: (-x['margin'], -x['potential']))

def calculate_craft_profits(products):
    crafts = []
    for result_id, recipe in CRAFT_RECIPES.items():
        try:
            result_data = products[result_id]
            sell_price = result_data['sell_summary'][0]['pricePerUnit']
            material_cost = 0
            materials_text = []
            
            for material_id, quantity in recipe['materials'].items():
                material_cost += products[material_id]['buy_summary'][0]['pricePerUnit'] * quantity
                materials_text.append(f"{quantity} {material_id.replace('_', ' ')}")
                
            total_sell = sell_price * recipe['amount']
            profit = total_sell - material_cost
            margin = (profit / material_cost) * 100 if material_cost > 0 else 0
            
            if profit >= MIN_CRAFT_PROFIT:
                status = result_data.get('quick_status', {})
                volume = min(status.get('buyMovingWeek', 0), status.get('sellMovingWeek', 0))
                
                crafts.append({
                    "name": result_id.replace("_", " ").title(),
                    "type": "craft",
                    "cost": material_cost,
                    "sell": total_sell,
                    "profit": profit,
                    "margin": margin,
                    "materials": ", ".join(materials_text),
                    "volume": volume,
                    "potential": profit * (volume // 1000)
                })
                
        except KeyError:
            continue
    
    return sorted(crafts, key=lambda x: (-x['margin'], -x['potential']))

def get_best_opportunities(flips, crafts):
    all_ops = flips + crafts
    return sorted(all_ops, key=lambda x: (-x['potential'], -x['margin']))[:10]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    products = fetch_bazaar_data()
    if not products:
        return jsonify({"error": "Failed to fetch bazaar data"}), 500
        
    flips = calculate_flip_profits(products)
    crafts = calculate_craft_profits(products)
    best = get_best_opportunities(flips, crafts)
    
    return jsonify({
        "flips": flips[:100],
        "crafts": crafts,
        "best": best,
        "timestamp": datetime.now().isoformat(),
        "stats": {
            "total_flips": len(flips),
            "total_crafts": len(crafts),
            "avg_flip_margin": sum(f['margin'] for f in flips[:100])/len(flips[:100]) if flips else 0,
            "avg_craft_margin": sum(c['margin'] for c in crafts)/len(crafts) if crafts else 0
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
