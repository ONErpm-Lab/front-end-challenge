## Projeto
Embora este desafio seja focado no frontend, surgiu a necessidade de implementar um webservice atuando como um proxy para gerenciar as requisições do frontend. Esse intermediário possibilita uma conexão suave entre o frontend e o Spotify, já que a Web API do Spotify exige autenticação por meio de chaves secretas. O uso desse proxy evita a exposição direta da chave, cuida do processo de autenticação e gerencia os dados provenientes da Web API do Spotify.

O projeto pode ser acessado em: [https://front-end-challenge-flame.vercel.app/](https://front-end-challenge-flame.vercel.app/)

### Pré-requisitos
Certifique-se de ter os seguintes softwares instalados em seu sistema operacional:
- Npm
- NodeJS v18

Caso queira usar os scripts de instalação, execução e encerramento, também serão necessários os softwares listados abaixo:
- Bash
- killall
- lsof

IMPORTANTE: Também será necessário o seu Client ID e o Client Secret da [Web API do Spotify](https://developer.spotify.com/documentation/web-api).

### Funcionalidades
- Pesquisa de faixas pelo ISRC
- Informações de cada faixa exibidas:
  - Capa do álbum
  - Data de lançamento
  - Título da faixa
  - Lista dos artistas da faixa
  - Duração da faixa em minutos e segundos (mm:ss)
  - Player com prévia do áudio
  - Link para a página da faixa no Spotify
  - Indicação de disponibilidade da faixa no Brasil (BR)
- Listagem alfabética das faixas por seus nomes
- Aviso exibido quando a integração com o fornecedor de dados não está disponível.

### Tecnologias utilizadas
- Frontend:
  - Angular 13
  - Scss
- Webservice:
  - NodeJS
  - Express

### Configurando o ambiente
- Copie o arquivo backend/.env.example
- Cole a cópia no mesmo diretório (backend) e renomeie-a para .env
- Edite o arquivo .env da seguinte forma:
  - Atribua o seu Client ID à variável CLIENT_ID
  - Atribua o seu Client Secret à variável CLIENT_SECRET

### Executando o projeto usando os scripts de instalação e inicialização
Siga os passos abaixo a partir do diretório raiz do projeto no seu terminal:
- Instale as dependências do projeto:
```sh
  $ ./install.sh
```
- Inicie o backend e o frontend:
```sh
  $ ./start.sh
```

### Executando o Projeto manualmente
A partir do diretório raiz do projeto, execute os seguintes comandos:
- Instale as dependências do projeto:
```sh
  $ cd ./backend && npm install
  $ cd ../frontend && npm install
```
- Para iniciar o backend e o frontend, serão necessárias duas sessões terminais, abertas a partir do diretório raiz do projeto:
  - Primeira sessão:
  ```sh
    $ cd backend && npm run dev
  ```
  - Segunda sessão:
  ```sh
    $ cd frontend && npm run dev
  ```
  OBS.: É importante que o backend esteja em execução antes do acesso à rota /tracks no frontend, caso contrário ocorrerá um erro ao acessá-la.

### Encerrando a execução do projeto usando o script de encerramento
Para parar a execução do projeto, execute o seguinte comando a partir do diretório raiz do projeto no seu terminal:
```sh
  $ ./stop.sh
```

### Encerrando a execução do projeto manualmente
Para encerrar a execução do projeto manualmente, basta finalizar a execução do frontend e do backend em cada uma de suas respectivas sessões, inicializadas anteriormente pela inicialização manual do projeto.

## Início

Bem vindo ao mundo da música!

Atualmente temos a necessidade de consumir os dados de faixas musicais através do código ISRC, que é uma das coisas mais importantes na indústria fonográfica.

Segundo [Abramus](https://www.abramus.org.br/musica/isrc/), ISRC (International Standard Recording Code ou Código de Gravação Padrão Internacional) é um padrão internacional de código para identificar de forma única as gravações (faixas).

Ele funciona como um código de barras da faixa.


## Problema

Durante o fechamento de contrato com um produtor, foram informados 10 ISRC's que não constam em nossas bases de dados, que seguem abaixo:

* US7VG1846811
* US7QQ1846811
* BRC310600002
* BR1SP1200071
* BR1SP1200070
* BR1SP1500002
* BXKZM1900338
* BXKZM1900345
* QZNJX2081700
* QZNJX2078148

Precisamos obter e exibir os seguintes dados:

* Thumb do álbum
* Data de lançamento
* Título da faixa
* Lista dos artistas da faixa
* Duração da faixa em minutos e segundos (mm:ss)
* Player com prévia do áudio
* Link para a página da faixa no Spotify
* Sinalização dizendo se a faixa está ou não disponível no Brasil (BR)

Por decisão técnica, precisamos exibí-los através de uma webpage pública, ordenados por título da faixa de forma alfabética, sem necessidade de armazenamento para consulta posterior.

Caso a integração com o fornecedor dos dados não esteja disponível, um alerta deve ser dado ao usuário.


## Requisitos

* Faça um fork deste repositório e abra um PR quando estiver finalizado.
* O frontend deve ser no  deve ser feito em Angular 10 ou superior.
* A página deve ser responsiva para atender todos os tipos de dispositivos.
* Use a API do Spotify: [https://developer.spotify.com/](https://developer.spotify.com/) para coletar os dados das faixas.


## Diferencial

* Desenvolver testes unitários e de integração.


## O que será avaliado

* Fidelidade às instruções.
* Padrões de projeto.
* Clean Code e boas práticas.
* Boas práticas de versionamento.


## Perfil que buscamos

* Comunicativo
* Autodidata
* Automotivado
* Curioso
* Gostar de trabalhar em equipe
* Compromissado
