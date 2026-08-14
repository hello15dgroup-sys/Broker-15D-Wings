import re
import glob

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # ensure backdrop-blur becomes backdrop-blur-[10px]
    # some might be backdrop-blur-md, backdrop-blur-sm, backdrop-blur-2xl, etc.
    # We can replace 'backdrop-blur ' with 'backdrop-blur-[10px] '
    content = re.sub(r'backdrop-blur-(sm|md|lg|xl|2xl|3xl)', 'backdrop-blur-[10px]', content)
    content = re.sub(r'backdrop-blur(\s|")', r'backdrop-blur-[10px]\1', content)
    
    with open(file, 'w') as f:
        f.write(content)

