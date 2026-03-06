@echo off
echo Hazirlanmis kodlar Github'a gonderiliyor...

echo.
git add .
git commit -m "Deployment ayarlari ve duzeltmeler"
git push

echo.
echo Islem tamamlandi. Pencereyi kapatabilirsiniz.
pause
