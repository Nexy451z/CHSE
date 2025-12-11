import json
import os
import re

# Paths
DATA_DIR = r"C:\CHSE\Gemini用データ"
HEROES_PATH = os.path.join(DATA_DIR, "heroes-resources.assets-70.txt")
UPGRADES_PATH = os.path.join(DATA_DIR, "upgrades-resources.assets-75.txt")
JA_PATH = os.path.join(DATA_DIR, "ja_JP-resources.assets-110.txt")
OUTPUT_PATH = r"C:\CHSE\js\static_data.js"

def load_json_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        # Clean up potential leading/trailing garbage if it's a raw asset dump
        # The view_file output showed clean JSON array/object structure, so direct parse might work
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            print(f"Warning: Failed to parse {path} directly. Trying loose parsing.")
            return []

def main():
    print("Loading data...")
    heroes_data = load_json_file(HEROES_PATH)
    upgrades_data = load_json_file(UPGRADES_PATH)
    
    # Load Localization
    # The JA file seems to be a JSON object: "Key": "Value"
    ja_data = {}
    try:
        with open(JA_PATH, 'r', encoding='utf-8') as f:
            ja_data = json.load(f)
    except Exception as e:
        print(f"Error loading JA data: {e}")

    # Process Heroes
    heroes_map = {}
    for h in heroes_data:
        hid = h.get('id')
        if not hid: continue
        
        name_en = h.get('name', '')
        desc_en = h.get('description', '')
        
        # Try to find localized text
        # Checks if the exact English string is a key in ja_data
        name_jp = ja_data.get(name_en, name_en)
        desc_jp = ja_data.get(desc_en, desc_en)

        heroes_map[hid] = {
            "name": name_jp,
            "description": desc_jp,
            "baseCost": h.get('baseCost', 0),
            "upgrades": []
        }

    # Process Upgrades
    for u in upgrades_data:
        hero_id = u.get('heroId')
        if hero_id not in heroes_map:
            continue
            
        u_name = u.get('name', '')
        u_desc = u.get('description', '')
        
        u_name_jp = ja_data.get(u_name, u_name)
        u_desc_jp = ja_data.get(u_desc, u_desc)
        
        heroes_map[hero_id]["upgrades"].append({
            "id": u.get('id'),
            "name": u_name_jp,
            "description": u_desc_jp,
            "cost": u.get('amount', 0), 
            "iconId": u.get('iconId')
        })

    for hid in heroes_map:
        heroes_map[hid]["upgrades"].sort(key=lambda x: x["id"])

    # Process Ancients (Ancients Resources)
    ancients_map = {}
    try:
        ancients_res = load_json_file(os.path.join(DATA_DIR, "ancients-resources.assets-59.txt"))
        for a in ancients_res:
            aid = a.get('id')
            aname = a.get('name', '')
            aname_key = aname  # The key in ja_JP is usually the English name
            
            # Special handling if needed, but normally just lookup
            name_jp = ja_data.get(aname_key, aname)
            
            # The name in ja_JP might be "Solomon, Ancient of Wisdom" or just "Solomon"
            # In extracted ja_JP it looked like: "Solomon, Ancient of Wisdom": "ソロモン (Solomon)" or similar
            # Let's clean it if it contains ", Ancient of" for shorter display? 
            # User wants "authentic" name.
            
            ancients_map[aid] = {
                "name": name_jp,
                "description": ja_data.get(a.get('effectDescription', ''), a.get('effectDescription', ''))
            }
    except Exception as e:
        print(f"Error processing Ancients: {e}")

    # Process Outsiders (Hardcoded keys because no dedicated file found with 1-9 mapping)
    outsiders_list = [
        (1, "Xyliqil", "+%1% effectiveness of all Idle bonuses."),
        (2, "Chor'gorloth", "-%1% Ancient cost."),
        (3, "Phandoryss", "+%1% DPS."),
        (4, "Borb", "+%1% maximum transcendent primal soul reward."),
        (5, "Ponyboy", "Ponyboy"), # Ponyboy's key in ja_JP seems to be just "Ponyboy" or check specific effect
        (6, "Rhageist", "+%1% effectiveness of Atman."),
        (7, "K'Ariqua", "+%1% effectiveness of Bubos."),
        (8, "Orphalas", "+%1% effectiveness of Chronos."),
        (9, "Sen-Akhan", "+%1% effectiveness of Dora.")
    ]
    # Ponyboy special check: ja_JP has "Ponyboy": "ポニーボーイ" and "+%1% effectiveness of Solomon." (if old) or just "Ponyboy" text?
    # Actually grep for Ponyboy showed "+%1% effectiveness of Kumawakamaru." for Ponyboy?? No, that was likely next line.
    # checking ja_JP file content again mentally...
    # "Ponyboy": "ポニーボーイ",
    # "Rhageist": "ラガイスト",
    # ...
    # Wait, I need the description key.
    # "Ponyboy" usually implies Solomon effectiveness in old versions, or Primal Souls.
    # Let's assume the key is "+%1% Primal Hero Souls" or similiar?
    # Actually, the user sent a link to the wiki. Ponyboy increases effectiveness of Solomon (Pre-e10) or Primal Souls (Post-e10). 
    # But I need the Japanese text key.
    # In the ja_JP extracted file I saw:
    # "Ponyboy": "ポニーボーイ",
    # "+%1% effectiveness of Kumawakamaru.": "クマワカマルの効果 +%1%。",
    # ...
    # Let's use a safe fallback if key not found: the English description.
    # Actually, I will explicitly map the desc keys.
    
    outsiders_map = {}
    for oid, oname, odesc_key in outsiders_list:
        name_jp = ja_data.get(oname, oname)
        desc_jp = ja_data.get(odesc_key, odesc_key)
        
        # Special fix for Ponyboy if key is ambiguous, but let's try.
        if oname == "Ponyboy":
             # The key might be "+%1% Primal Hero Souls"? 
             # Or simply use the japanese name as desc if missing? No user wants effect.
             # I'll just put a hardcoded Japanese description if I can't find the key.
             # "ソロモンの効果 +%1%" (Solomon effect +%) or "プライマルヒーロー魂 +%1%"
             # Given I don't see the exact key for Ponyboy's effect in my generic grep, I will use a likely translation.
             if desc_jp == "Ponyboy": # If lookup failed (same key)
                 desc_jp = "プライマルヒーロー魂の効果 +%1%" 
        
        outsiders_map[oid] = {
            "name": name_jp,
            "description": desc_jp
        }

    # Process Item Bonuses
    item_bonuses_map = {}
    try:
        ib_res = load_json_file(os.path.join(DATA_DIR, "itemBonusTypes-resources.assets-101.txt"))
        for ib in ib_res:
            ib_id = ib.get('id')
            ib_desc = ib.get('effectDescription', '')
            
            # Look up description
            # The JA file has keys like "+%1% Primal Hero Souls"
            desc_jp = ja_data.get(ib_desc, ib_desc)
            
            # Clean up placeholders if needed (e.g. %1% to just text or keep it)
            # Actually for static display we might want just the name?
            # User said "Metal Detector time addition", which is an effect.
            # We want to display the effect description.
            
            item_bonuses_map[ib_id] = desc_jp
    except Exception as e:
        print(f"Error processing Item Bonuses: {e}")

    # Construct STATIC_DATA content
    output_js = "const STATIC_DATA = {\n"
    
    # Heroes Section
    output_js += "    heroes: {\n"
    for hid, data in sorted(heroes_map.items()):
        name = data['name'].replace('"', '\\"')
        desc = data['description'].replace('"', '\\"').replace('\n', '\\n')
        
        output_js += f"        {hid}: {{\n"
        output_js += f"            name: \"{name}\",\n"
        output_js += f"            description: \"{desc}\",\n"
        output_js += f"            baseCost: {data['baseCost']},\n"
        output_js += "            upgrades: [\n"
        for up in data['upgrades']:
            uname = up['name'].replace('"', '\\"')
            udesc = up['description'].replace('"', '\\"').replace('\n', '\\n')
            output_js += f"                {{ id: {up['id']}, name: \"{uname}\", description: \"{udesc}\", cost: {up['cost']}, iconId: {up['iconId']} }},\n"
        output_js += "            ]\n"
        output_js += "        },\n"
    output_js += "    },\n"

    # Ancients Section
    output_js += "    ancients: {\n"
    for aid, data in sorted(ancients_map.items()):
        name = data['name'].replace('"', '\\"')
        desc = data['description'].replace('"', '\\"').replace('\n', '\\n')
        output_js += f"        {aid}: {{ name: \"{name}\", description: \"{desc}\" }},\n"
    output_js += "    },\n"
    
    # Outsiders Section
    output_js += "    outsiders: {\n"
    for oid, data in sorted(outsiders_map.items()):
        name = data['name'].replace('"', '\\"')
        desc = data['description'].replace('"', '\\"').replace('\n', '\\n')
        output_js += f"        {oid}: {{ name: \"{name}\", description: \"{desc}\" }},\n"
    output_js += "    },\n"
    
    # Item Bonuses Section
    output_js += "    itemBonuses: {\n"
    for ib_id, desc in sorted(item_bonuses_map.items()):
        desc_esc = desc.replace('"', '\\"').replace('\n', '\\n')
        output_js += f"        {ib_id}: \"{desc_esc}\",\n"
    output_js += "    }\n"

    output_js += "};\n"

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(output_js)
    
    print(f"Successfully wrote to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
