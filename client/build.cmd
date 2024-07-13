call npx tsc ..\MessageExchange.ts
call npx browserify .\client.js -p esmify > bundle.js

@REM serve: npx http-server