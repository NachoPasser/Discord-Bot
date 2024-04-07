# Tibu
Tibu es un bot de Discord capaz de buscar y reproducir audios de videos de Youtube. Fue creado por fines educativos y por necesidad, lo utilizo en servidor que tengo con unos amigos. 
Como tal, **no es publico** y no fue construido con la intención de ser usado en múltiples servidores. 

Respecto a las tecnologias, el bot fue creado en JavaScript haciendo uso de discord.js para interactuar con Discord, la API de Youtube para buscar el video y play-dl para reproducir el audio del video.

## Comandos de reproducción
- !yt <canción>: busca el video según su titulo o su URL y luego lo reproduce en el canal de voz donde se encuentre el usuario que lo solicito.
- /play <canción>: hace lo mismo que el anterior. Existe porque algunas personas prefieren utilizar los comandos de Discord para interactuar con bots.

## Comandos de botones
Cuando se ejecuta un comando de reproducción, Tibu envía un mensaje al canal de texto donde dicho comando fue solicitado, que contiene la información del video actual. 

![image](https://github.com/NachoPasser/Discord-Bot/assets/85080689/e6e48d97-f18b-4c45-bed0-2e2ddf364537)

Como se puede apreciar, debajo de la información hay 2 botones: Detener y Saltear. Cuando un usuario los pulsa se ejecuta el comando asociado a dicho botón. Ahora explicaré su función.

## Cola de canciones
Cuando se solicita una canción mientras se está reproduciendo otra, está se encola y se reproduce cuando la anterior termina. Luego de encolar la canción, Tibu lanza este aviso al canal de texto donde se solicito la canción:

![image](https://github.com/NachoPasser/Discord-Bot/assets/85080689/e40e78d4-9a1a-4047-b7df-0e78a155b6b5)

El usuario puede optar por saltar la canción que se está reproduciendo y reproducir la que le sigue con el comando Saltear. Si no hay más canciones, Tibu lanza este aviso:

![image](https://github.com/NachoPasser/Discord-Bot/assets/85080689/9b2a2236-d615-4ba5-ab98-e2ecbf3b56f2)

## Detener
Si el usuario decide detener al bot, puede ejecutar el comando Detener presionado el botón de dicho nombre. La canción dejará de reproducirse y Tibu se desconectará enviándo este aviso:

![image](https://github.com/NachoPasser/Discord-Bot/assets/85080689/b583cf90-b3a0-4a0d-a266-3be489ae7a37)

Cabe destacar que Tibu se detendrá por su cuenta si permanece inactivo durante 3 minutos.

## Precauciones
Tibu envía ciertos avisos ante ciertas situaciones, ahora las nombraré:
- Si el usuario no está conectado a un canal de voz.
- Si el usuario no está conectado al mismo canal de voz que Tibu.
- Si el usuario no incluyo una canción a la hora de ejecutar !yt.
- Si no se encontró un video que cumpla con el termino especificado.
- Si ocurrio un error inesperado.
- Si la cuota diaria de la API de Youtube se acabo.
