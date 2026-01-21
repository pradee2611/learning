import json
import random

# Read the JSON file
with open('src/data/databrickDump.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Shuffle the questions
random.shuffle(questions)

# Shuffle the choices within each question
for question in questions:
    if 'choices' in question and isinstance(question['choices'], list):
        # Store the mapping of old choices to new positions
        choices = question['choices']
        
        # Create a mapping of choice letters (A, B, C, D, E) to actual choice text
        choice_map = {}
        for i, choice_text in enumerate(choices):
            # Extract the letter from the choice (e.g., "A. " from "A. Some text")
            if choice_text and len(choice_text) > 2 and choice_text[1] == '.':
                original_letter = choice_text[0]
                choice_map[original_letter] = choice_text[3:]  # Get text without "A. "
        
        # Shuffle the choice values (the text parts without letters)
        choice_values = list(choice_map.values())
        random.shuffle(choice_values)
        
        # Assign new letters to shuffled choices
        new_letters = ['A', 'B', 'C', 'D', 'E']
        new_choice_map = {}
        for i, value in enumerate(choice_values):
            new_choice_map[new_letters[i]] = value
        
        # Create reverse mapping to update correct_answer
        reverse_map = {}
        for old_letter, text in choice_map.items():
            for new_letter, new_text in new_choice_map.items():
                if text == new_text:
                    reverse_map[old_letter] = new_letter
                    break
        
        # Update the choices with shuffled values
        question['choices'] = [f"{new_letters[i]}. {choice_values[i]}" for i in range(len(choice_values))]
        
        # Update correct_answer based on the new positions
        if isinstance(question['correct_answer'], list):
            question['correct_answer'] = [reverse_map[ans] for ans in question['correct_answer']]
        else:
            question['correct_answer'] = reverse_map[question['correct_answer']]

# Write the shuffled data back to the file
with open('src/data/databrickDump.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print("Questions and options have been shuffled successfully!")
