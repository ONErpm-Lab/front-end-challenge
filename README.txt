Passo a passo para a execução do projeto:

1 - Executar o comando 'npm install' na raíz do projeto
2 - Executar o comando 'npm install' dentro da pasta 'backend'
3 - Abrir um terminal apontando para a pasta 'backend' e executar o comando 'node server.js'
4 - Abrir um terminal apontando para a raiz do projeto e executar o comando 'npm start'

Algumas observações:

- Criei uma pasta "backend" para simular um servidor onde ficaria armazenado o "client_id" e o "client_secret" (este por medidas de segurança,
pois não é aconselhável manter essa chave no arquivo environment.ts)

- Ao criar o app dentro do Spotify para obter as chaves client_id e client_secret, observei que não é mais possível
preencher o campo Redirect URIs com o valor http://localhost:4200. Após dar uma lida na documentação, vi que a orientação
agora é substituir a palavra localhost por 127.0.0.1. Sendo assim, ao executar o projeto, o mesmo abrirá no seguinte
endereço: http://127.0.0.1:4200/