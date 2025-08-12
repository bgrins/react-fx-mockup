#!/usr/bin/env python
"""
Fetch Hugging Face dataset and save to CSV using the datasets library.

Setup:
    1. Create a virtual environment:
       uv venv
    
    2. Install dependencies:
       uv pip install datasets pandas
    
    3. Run the script:
       uv run python scripts/fetch_huggingface_dataset.py
       
       Or with force refresh:
       uv run python scripts/fetch_huggingface_dataset.py --force

This will fetch the entire synthetic_profiles_ver_1 dataset (~58k rows)
from Hugging Face and save it to public/synthetic_profiles.csv
"""

from datasets import load_dataset
import pandas as pd
import sys

def fetch_dataset(force_refresh=False):
    print("Loading dataset from Hugging Face...")
    
    # Load the dataset (this will cache it locally)
    dataset = load_dataset("zijuncheng/synthetic_profiles_ver_1", split="train")
    
    print(f"Dataset loaded: {len(dataset)} rows")
    
    # Convert to pandas DataFrame
    df = pd.DataFrame(dataset)
    
    # Select only the columns we need for the CSV (matching the original format)
    columns_to_keep = [
        'persona', 'visit_id', 'visit_time', 'visit_description', 
        'place_id', 'url', 'title', 'domain', 'visit_count', 
        'interest', 'title_name'
    ]
    
    # Filter to only columns that exist
    available_columns = [col for col in columns_to_keep if col in df.columns]
    df = df[available_columns]
    
    # Save to CSV
    output_path = "public/synthetic_profiles.csv"
    df.to_csv(output_path, index=False)
    print(f"Saved {len(df)} rows to {output_path}")
    
    # Show unique personas
    unique_personas = df['persona'].unique()
    print(f"Unique personas found: {sorted(unique_personas)}")
    print(f"Persona distribution:")
    print(df['persona'].value_counts())

if __name__ == "__main__":
    force = "--force" in sys.argv or "-f" in sys.argv
    fetch_dataset(force)