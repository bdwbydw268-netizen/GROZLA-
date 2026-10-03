with open('src/components/SuspendedAccount.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("""      {/* END OF INFO VIEW */}
      )}""", """      ))}""")

with open('src/components/SuspendedAccount.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
