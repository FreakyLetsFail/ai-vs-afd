#!/bin/bash
# AI-vs-AfD Daily Cleanup
# Läuft täglich und entfernt alte fetch-Logs

DATA_DIR="/home/adm1n/.openclaw/workspace/ai-vs-afd/data"
MAX_AGE_DAYS=7

echo "[Cleanup] Entferne Einträge älter als ${MAX_AGE_DAYS} Tage..."
find "$DATA_DIR" -name "*.json" -type f -mtime +$MAX_AGE_DAYS -delete
echo "[Cleanup] Fertig. Verbleibende Dateien:"
ls -la "$DATA_DIR/"