# Challenge Front-End API Spotify -  ONErpm
Esta é uma aplicação Angular, que permite ao usuário consumir os dados das informações de faixas musicais utilizando o código ISRC na API do Spotify.
<br>

### Desafio proposto
O desafio consiste em fazer uma busca de 10 ISRCs (segue abaixo os solicitados) buscar e exibir as informações de **Thumb do álbum**, **Data de lançamento**, **Título da faixa**, **Lista dos artistas da faixa**, **Duração da faixa em minutos e segundos (mm:ss)**, **Player com prévia do áudio**, **Link para a página da faixa no Spotify** e **Sinalização dizendo se a faixa está ou não disponível no Brasil (BR)**. Essas informações, tem que ser apresentadas através de uma webpage responsiva e publica, com as faixas ordenadas em ordem alfabética pelo título.
<br>

**ISRCs pesquisados**
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


## 🚀 Começando:

Essas instruções permitirão que você consiga ter esse projeto em operação na sua máquina local para fins de desenvolvimento e teste.

### 📋 Pré-requisitos para instalação:

* Instale **NodeJS** em seu computador (versão 18 ou superior).
* Instale o **Angular CLI**
* Criei sua conta e suas credenciais na **API do Spotify** [aqui](https://developer.spotify.com/)
<br>

### ⚙️ Configurando o projeto:
1. Clone esse repositório utilizando o comando

```git clone git@github.com:SahBianchi/front-end-challenge.git```

2. Entre na pasta do projeto utilizando o comando

```cd challenge-onerpm```

3. Instale as dependências utilizando o comando

```npm install```

4. Entre no arquivo `.env-sample`, edite o arquivo com as **chaves geradas na api do Spotify** e renomeie ele apenas para `.env`

5. Após essas configurações de o comando para iniciar o servidor
```npm start``` ou ```ng serve```
