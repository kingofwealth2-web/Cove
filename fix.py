with open('c:\\Users\\kofiw\\Desktop\\cove\\src\\screens\\AddTransactionPanel.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('“', '"').replace('”', '"').replace('…', '...')

with open('c:\\Users\\kofiw\\Desktop\\cove\\src\\screens\\AddTransactionPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(content)