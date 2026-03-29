import gradio as gr
from ultralytics import YOLO
from PIL import Image

# best.pt must be uploaded to the HuggingFace Space alongside this file
model = YOLO('best.pt')

# Approximate kcal per standard serving for 115 NutriGame classes
FOOD_CALORIES = {
    'Adana_Kebap':       350,
    'Almond':            164,
    'Ankara_Tava':       320,
    'Apple':              95,
    'Asparagus':          27,
    'Avocado':           234,
    'Ayran':              56,
    'Bacon':             215,
    'Baklava':           330,
    'Banana':            105,
    'Beans':             130,
    'Bell_Pepper':        31,
    'Biber_Dolmasi':     210,
    'Black_Olives':      115,
    'Blackberry':         43,
    'Bread':             265,
    'Broccoli':           55,
    'Bulgur_Pilavi':     150,
    'Burger':            550,
    'Cabbage':            25,
    'Cacik':              60,
    'Carrot':             41,
    'Cauliflower':        25,
    'Cheese':            400,
    'Cheesecake':        325,
    'Chips':             540,
    'Cig_Kofte':         150,
    'Corn':              132,
    'Cucumber':           16,
    'Doner_Et':          350,
    'Doner_Tavuk':       290,
    'Domates_Corbasi':    80,
    'Et_Sote':           310,
    'Etli_Turlu':        250,
    'Ezogelin_Corba':    120,
    'Fish':              200,
    'Fried_Chicken':     320,
    'Fried_Eggs':        185,
    'Fried_Meat':        330,
    'Grapes':             69,
    'Green_Beans':        35,
    'Irmik_Tatlisi':     380,
    'Iskender_Et':       480,
    'Iskender_Tavuk':    420,
    'Spinach':            41,
    'Izmir_Kofte':       310,
    'Kabak_Mucver':      180,
    'Kabak_Tatlisi':     230,
    'Kadinbudu_Kofte':   290,
    'Kasarli_Pide':      380,
    'Kir_Pidesi':        310,
    'Kiwi':               61,
    'Kiymali_Pide':      370,
    'Kunefe':            420,
    'Kusbasli_Pide':     360,
    'Lahmacun':          265,
    'Lemon':              29,
    'Mandarin':           53,
    'Melon':              36,
    'Menemen':           180,
    'Mercimek_Coftesi':  190,
    'Mercimek_Corbasi':  130,
    'Midye_Dolma':       200,
    'Midye_Tava':        280,
    'Mumbar_Dolmasi':    300,
    'Mushrooms':          22,
    'Orange':             62,
    'Pasta':             350,
    'Patlican_Kebabi':   270,
    'Pineapple':          82,
    'Pizza':             285,
    'Porridge':          150,
    'Potatoes':          160,
    'Raspberry':          52,
    'Rice':              200,
    'Salad':              80,
    'Sausages':          300,
    'Sehriye_Corbasi':   110,
    'Strawberry':         32,
    'Suffle':            310,
    'Sutlac':            180,
    'Sweet_Potatoes':    130,
    'Tantuni_Et':        320,
    'Tantuni_Tavuk':     270,
    'Tarhana_Corbasi':   100,
    'Tea':                 2,
    'Tomato':             22,
    'Watermelon':         30,
    'Yayla_Corbasi':     120,
    'Zucchini':           17,
    'Apple_Pie':         296,
    'Blueberry':          57,
    'Boiled_Eggs':       155,
    'Borek':             320,
    'Brownie':           350,
    'Cheburek':          390,
    'Chocolate':         546,
    'Churro':            115,
    'Cookies':           480,
    'Cream_Puff':        280,
    'Crepe':             190,
    'Croissant':         406,
    'Doughnut':          253,
    'Gozleme':           300,
    'Grilled_Eggplant':   65,
    'Ice_Cream':         207,
    'Mashed_Potato':     110,
    'Muffin':            340,
    'Pancakes':          230,
    'Popcorn':           375,
    'Samsa':             340,
    'Scrambled_Egg':     185,
    'Simit':             280,
    'Tiramisu':          270,
    'Waffle':            310,
}

CONF_THRESHOLD = 0.30


def detect_food(image):
    if image is None:
        return None, 'NOT_FOOD: No image provided. Please upload a food photo.'

    results = model(image)
    result  = results[0]

    annotated_rgb = Image.fromarray(result.plot()[..., ::-1])

    food_detections = []
    total_calories  = 0

    for box in result.boxes:
        confidence = float(box.conf[0])
        if confidence < CONF_THRESHOLD:
            continue
        class_name = model.names[int(box.cls[0])]
        calories   = FOOD_CALORIES.get(class_name)
        if calories is None:
            continue
        food_detections.append({
            'name':       class_name,
            'confidence': confidence,
            'calories':   calories,
        })
        total_calories += calories

    if not food_detections:
        any_detected = any(float(b.conf[0]) >= CONF_THRESHOLD for b in result.boxes)
        msg = (
            'NOT_FOOD: No food items detected. Please retake the photo with food visible.'
            if any_detected else
            'NOT_FOOD: Nothing detected. Please take a clearer photo of the food.'
        )
        return annotated_rgb, msg

    lines = ['Detected items:']
    for item in food_detections:
        lines.append(f"• {item['name']}: {item['confidence']:.1%} (~{item['calories']} kcal)")
    if total_calories > 0:
        lines.append(f'\nEstimated total: ~{total_calories} kcal')

    return annotated_rgb, '\n'.join(lines)


demo = gr.Interface(
    fn=detect_food,
    inputs=gr.Image(type='pil', label='Upload Food Image'),
    outputs=[
        gr.Image(type='pil', label='Detection Result'),
        gr.Textbox(label='Detected Foods & Calorie Estimates', lines=8),
    ],
    title='NutriGame Food Detection',
    description='Upload a food photo to detect items and estimate calories. Supports 115 food classes including Turkish cuisine.',
    cache_examples=False,
)

if __name__ == '__main__':
    demo.launch()
