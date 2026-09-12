"""
Retail Sales Benchmark Data Generator
Produces 300,000 rows of realistic retail transaction data.
Output: data/sales_data.csv (~22MB) and public/sales_data.csv (served statically)
"""

import csv
import random
import os
import sys
from datetime import date, timedelta

TOTAL_ROWS = 300_000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "sales_data.csv")
RANDOM_SEED = 42

random.seed(RANDOM_SEED)

REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East & Africa"]

CATEGORIES = {
    "Electronics":    ["Laptop Pro 15", "Wireless Earbuds X", "Smart Watch Ultra", "4K Monitor 27",
                       "Mechanical Keyboard", "USB-C Hub", "Webcam HD 1080p", "Portable SSD 1TB",
                       "Gaming Mouse", "Noise Cancelling Headphones", "Tablet 10 Pro", "Smartphone S23"],
    "Apparel":        ["Running Shoes V3", "Yoga Pants Elite", "Winter Jacket Pro", "Cotton T-Shirt Pack",
                       "Denim Jeans Slim", "Sports Bra Ultra", "Hiking Boots", "Compression Socks",
                       "Fleece Hoodie", "Athletic Shorts", "Rain Jacket Lite", "Polo Shirt Classic"],
    "Home & Garden":  ["Air Purifier HEPA", "Robot Vacuum X10", "Smart Thermostat", "LED Strip Lights",
                       "Standing Desk 60in", "Ergonomic Chair", "Blender Pro 2000", "Coffee Maker Plus",
                       "Instant Pot 6Qt", "Air Fryer XL", "Garden Hose 50ft", "Planters Set 3pc"],
    "Beauty":         ["Vitamin C Serum", "Retinol Moisturizer", "SPF 50 Sunscreen", "Hair Growth Oil",
                       "Eyeshadow Palette", "Matte Lipstick Set", "Tinted BB Cream", "Face Mask Pack 10",
                       "Electric Toothbrush", "Perfume Floral 100ml", "Shampoo Keratin", "Body Lotion XL"],
    "Sports":         ["Yoga Mat Premium", "Resistance Bands Set", "Adjustable Dumbbells", "Pull-up Bar Pro",
                       "Cycling Helmet", "Tennis Racket Carbon", "Basketball Official", "Football Pro",
                       "Swimming Goggles", "Foam Roller 36in", "Jump Rope Speed", "Kettlebell 20lb"],
    "Food & Grocery": ["Protein Powder Whey", "Organic Green Tea 100", "Mixed Nuts 1kg", "Dark Chocolate 72pct",
                       "Olive Oil Extra Virgin", "Quinoa Organic 2lb", "Almond Milk 6pk", "Granola Bars 12pk",
                       "Instant Oatmeal 30pk", "Multivitamin 180ct", "Pre-workout Formula", "Collagen Peptides"],
}

CUSTOMER_SEGMENTS = ["Consumer", "Corporate", "Home Office", "Small Business"]

CATEGORY_CONFIG = {
    "Electronics":    {"rev_range": (49.99, 1299.99), "units_range": (1, 5)},
    "Apparel":        {"rev_range": (9.99, 189.99),   "units_range": (1, 8)},
    "Home & Garden":  {"rev_range": (19.99, 649.99),  "units_range": (1, 4)},
    "Beauty":         {"rev_range": (7.99, 129.99),   "units_range": (1, 6)},
    "Sports":         {"rev_range": (14.99, 349.99),  "units_range": (1, 5)},
    "Food & Grocery": {"rev_range": (4.99, 89.99),    "units_range": (2, 20)},
}

SEASONAL_WEIGHTS = [0.7, 0.75, 0.85, 0.9, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0, 1.4, 1.6]
REGION_MULTIPLIERS = {
    "North America": 1.3,
    "Europe": 1.1,
    "Asia Pacific": 1.0,
    "Latin America": 0.85,
    "Middle East & Africa": 0.9,
}

START_DATE = date(2022, 1, 1)
END_DATE   = date(2024, 12, 31)
DATE_RANGE_DAYS = (END_DATE - START_DATE).days


def random_date():
    return START_DATE + timedelta(days=random.randint(0, DATE_RANGE_DAYS))


def generate_row(row_id):
    category = random.choice(list(CATEGORIES.keys()))
    product  = random.choice(CATEGORIES[category])
    region   = random.choices(REGIONS, weights=[0.35, 0.25, 0.22, 0.10, 0.08])[0]
    segment  = random.choices(CUSTOMER_SEGMENTS, weights=[0.45, 0.30, 0.15, 0.10])[0]
    txn_date = random_date()

    cfg = CATEGORY_CONFIG[category]
    base_rev = random.uniform(*cfg["rev_range"])
    seasonal = SEASONAL_WEIGHTS[txn_date.month - 1]
    regional = REGION_MULTIPLIERS[region]
    units    = random.randint(*cfg["units_range"])
    revenue  = round(base_rev * seasonal * regional * units, 2)

    return {
        "id":               row_id,
        "date":             txn_date.isoformat(),
        "region":           region,
        "category":         category,
        "product_name":     product,
        "revenue":          revenue,
        "units_sold":       units,
        "customer_segment": segment,
    }


def main():
    sys.stdout.write("Generating %d rows -> %s\n" % (TOTAL_ROWS, OUTPUT_FILE))
    sys.stdout.flush()

    fieldnames = ["id", "date", "region", "category", "product_name",
                  "revenue", "units_sold", "customer_segment"]

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        batch_size = 10_000
        for start in range(0, TOTAL_ROWS, batch_size):
            end = min(start + batch_size, TOTAL_ROWS)
            rows = [generate_row(i + 1) for i in range(start, end)]
            writer.writerows(rows)

            if (start // batch_size) % 5 == 0:
                pct = (end / TOTAL_ROWS) * 100
                sys.stdout.write("  %9d / %d  (%.1f%%)\n" % (end, TOTAL_ROWS, pct))
                sys.stdout.flush()

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    sys.stdout.write("\nDone! File size: %.1f MB\n" % size_mb)
    sys.stdout.write("Output: %s\n" % OUTPUT_FILE)
    sys.stdout.flush()


if __name__ == "__main__":
    main()
