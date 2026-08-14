import re
import glob

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Rule: Replace font-lexend when paired with uppercase with font-sync
    # e.g., className="... font-lexend ... uppercase ..." -> className="... font-sync ... uppercase ..."
    # Or className="... uppercase ... font-lexend ..." -> className="... uppercase ... font-sync ..."
    
    def replace_font_lexend_uppercase(match):
        full_class = match.group(0)
        if 'font-lexend' in full_class and ('uppercase' in full_class or 'tracking-' in full_class):
            # If it's uppercase, switch font-lexend to font-sync
            if 'uppercase' in full_class:
                return full_class.replace('font-lexend', 'font-sync')
        return full_class

    new_content = re.sub(r'className="[^"]*"', replace_font_lexend_uppercase, content)

    # Write back if changed
    if new_content != content:
        with open(file, 'w') as f:
            f.write(new_content)

print("Font replacement complete.")
