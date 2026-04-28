import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("ayudas_alquiler_cam_2024.csv")

counts = df["español"].value_counts()
amounts = df.groupby("español")["ayuda_num"].sum()

labels = {True: "Español", False: "Extranjero"}
colors = {True: "#3b82f6", False: "#f97316"}

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))

ax1.pie(
    counts,
    labels=[labels[k] for k in counts.index],
    colors=[colors[k] for k in counts.index],
    autopct="%1.1f%%",
    startangle=90,
)
ax1.set_title("Número de beneficiarios\npor origen")

ax2.pie(
    amounts,
    labels=[labels[k] for k in amounts.index],
    colors=[colors[k] for k in amounts.index],
    autopct="%1.1f%%",
    startangle=90,
)
ax2.set_title("Importe total de ayudas (€)\npor origen")

plt.tight_layout()
plt.savefig("graficas_ayudas.png", dpi=150)
plt.show()
print("Gráficas guardadas en graficas_ayudas.png")
