import re
import glob

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # 1. Fonts
    # Lowercase UI text, labels, paragraphs should use lexend.
    content = content.replace('font-sync', 'font-lexend')
    content = content.replace('font-syncopate', 'font-lexend')
    content = content.replace('ui-sync', 'font-lexend')
    
    # We want to restore font-sync for H1, H2, H3 headers specifically
    content = re.sub(r'<h([1-3])(.*?)className="(.*?)"', lambda m: f'<h{m.group(1)}{m.group(2)}className="{m.group(3).replace("font-lexend", "font-sync")}"', content)
    
    # 2. Glassmorphism globally
    # Let's ensure 'backdrop-blur' is replaced with 'backdrop-blur-md' (12px) or 'backdrop-blur-[10px]' 
    # But more importantly, the prompt says: "re-apply a global CSS override to ensure all card containers utilize the backdrop-filter: blur(10px) effect with semi-transparent backgrounds"
    
    with open(file, 'w') as f:
        f.write(content)

with open('src/index.css', 'r') as f:
    css = f.read()

# Add a global utility or base class for glass panels
glass_css = """
@layer components {
  .glass-card {
    @apply bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-2xl;
  }
}
"""
if '.glass-card' not in css:
    css += glass_css

with open('src/index.css', 'w') as f:
    f.write(css)

