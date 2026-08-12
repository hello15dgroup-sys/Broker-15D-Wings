import re

def process_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        new_fonts = """export const GOOGLE_FONTS: GoogleFontSpec[] = [
  { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans, sans-serif', category: 'Modern' },
  { name: 'Playfair Display', family: 'Playfair Display, serif', category: 'Luxury' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'Modern' },
  { name: 'Cinzel', family: 'Cinzel, serif', category: 'Luxury' },
  { name: 'Syne', family: 'Syne, sans-serif', category: 'Display' },
  { name: 'Cormorant Garamond', family: 'Cormorant Garamond, serif', category: 'Luxury' },
  { name: 'Bodoni Moda', family: 'Bodoni Moda, serif', category: 'Luxury' },
  { name: 'Marcellus', family: 'Marcellus, serif', category: 'Luxury' },
  { name: 'Italiana', family: 'Italiana, serif', category: 'Luxury' },
  { name: 'Tenor Sans', family: 'Tenor Sans, sans-serif', category: 'Modern' },
  { name: 'Lora', family: 'Lora, serif', category: 'Serif' },
  { name: 'Space Grotesk', family: 'Space Grotesk, sans-serif', category: 'Modern' },
];"""
        new_content = re.sub(r'export const GOOGLE_FONTS: GoogleFontSpec\[\] = \[.*?\];', new_fonts, content, flags=re.DOTALL)

        with open(filepath, 'w') as f:
            f.write(new_content)
    except Exception as e:
        pass

process_file('src/components/broker/WhiteLabelProposalBuilder.tsx')
