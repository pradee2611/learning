import json
import re
from pathlib import Path
from collections import defaultdict

def normalize_question(question):
    """Normalize question text for comparison"""
    normalized = re.sub(r'\s+', ' ', question.strip().lower())
    return normalized

def load_questions(file_path):
    """Load questions from a JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    # File paths
    base_path = Path('src/data')
    files = {
        'dump': base_path / 'databrickDump.json',
        'file1': base_path / 'databrick1.json',
        'file2': base_path / 'databrick2.json',
        'mock1': base_path / 'databrickmock1.json',
        'mockpractice': base_path / 'databrickmockpratice.json'
    }
    
    print("=" * 80)
    print("VERIFICATION REPORT: Checking for Duplicates")
    print("=" * 80)
    
    # Load main dump
    print("\n1. Loading main dump (databrickDump.json)...")
    dump_questions = load_questions(files['dump'])
    dump_normalized = {}
    for q in dump_questions:
        normalized = normalize_question(q['question'])
        if normalized in dump_normalized:
            print(f"   WARNING: Duplicate found within dump itself: Q{q['question_number']}")
        dump_normalized[normalized] = q['question_number']
    print(f"   [OK] Main dump has {len(dump_questions)} questions")
    print(f"   [OK] {len(dump_normalized)} unique questions in dump")
    
    # Check each file for duplicates
    files_to_check = {
        'databrick1.json': files['file1'],
        'databrick2.json': files['file2'],
        'databrickmock1.json': files['mock1'],
        'databrickmockpratice.json': files['mockpractice']
    }
    
    total_duplicates_found = 0
    
    for file_name, file_path in files_to_check.items():
        print(f"\n2. Checking {file_name}...")
        questions = load_questions(file_path)
        duplicates_in_file = []
        
        for q in questions:
            normalized = normalize_question(q['question'])
            if normalized in dump_normalized:
                duplicates_in_file.append({
                    'question_number': q['question_number'],
                    'dump_question_number': dump_normalized[normalized],
                    'question_preview': q['question'][:100] + '...' if len(q['question']) > 100 else q['question']
                })
        
        if duplicates_in_file:
            print(f"   [ERROR] FOUND {len(duplicates_in_file)} DUPLICATES:")
            for dup in duplicates_in_file:
                print(f"      - Q{dup['question_number']} matches dump Q{dup['dump_question_number']}")
                print(f"        Preview: {dup['question_preview']}")
            total_duplicates_found += len(duplicates_in_file)
        else:
            print(f"   [OK] No duplicates found! ({len(questions)} unique questions)")
    
    # Check for duplicates between the other files (not in dump)
    print(f"\n3. Checking for duplicates BETWEEN other files (excluding dump)...")
    all_other_questions = {}
    cross_duplicates = defaultdict(list)
    
    for file_name, file_path in files_to_check.items():
        questions = load_questions(file_path)
        for q in questions:
            normalized = normalize_question(q['question'])
            if normalized not in dump_normalized:  # Only check questions not in dump
                if normalized in all_other_questions:
                    # Found duplicate between files
                    existing = all_other_questions[normalized]
                    cross_duplicates[normalized].append({
                        'file': file_name,
                        'question_number': q['question_number']
                    })
                    if len(cross_duplicates[normalized]) == 1:
                        # Add the first occurrence
                        cross_duplicates[normalized].insert(0, existing)
                else:
                    all_other_questions[normalized] = {
                        'file': file_name,
                        'question_number': q['question_number']
                    }
    
    if cross_duplicates:
        print(f"   [ERROR] FOUND {len(cross_duplicates)} cross-file duplicates:")
        for normalized, occurrences in cross_duplicates.items():
            print(f"      - Question appears in:")
            for occ in occurrences:
                print(f"        * {occ['file']} Q{occ['question_number']}")
    else:
        print(f"   [OK] No cross-file duplicates found!")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Main dump questions: {len(dump_questions)}")
    print(f"Duplicates found in other files: {total_duplicates_found}")
    print(f"Cross-file duplicates (not in dump): {len(cross_duplicates)}")
    
    if total_duplicates_found == 0 and len(cross_duplicates) == 0:
        print("\n[SUCCESS] VERIFICATION PASSED: No duplicates found!")
    else:
        print("\n[FAILED] VERIFICATION FAILED: Duplicates still exist!")
    
    print("=" * 80)

if __name__ == '__main__':
    main()

