warning: in the working copy of 'scaper.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/scaper.js b/scaper.js[m
[1mindex 0578f23..e0cc54e 100644[m
[1m--- a/scaper.js[m
[1m+++ b/scaper.js[m
[36m@@ -580,4 +580,5 @@[m [mapp.post('/close-browser', async (req, res) => {[m
 [m
 const PORT = process.env.PORT || 3000;[m
 app.listen(PORT, () => {[m
[32m+[m[32m  console.log(`Servidor escuchando en el puerto ${PORT}`);[m
 });[m
