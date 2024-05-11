const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const app = express();
const port = 3000;

// Configuração do multer para processar o upload do arquivo
const upload = multer({ dest: 'uploads/' });

// Inicializando a IA
const genAI = new GoogleGenerativeAI("AIzaSyBqDhQ-YeAKOOZb4TriJfDCig97KvD9wn0");
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

(async () => {
    try {
        // Função para ler a imagem do sistema de arquivos local
        const lerImagem = (caminho) => {
            return {
                inlineData: {
                    data: Buffer.from(fs.readFileSync(caminho)).toString("base64"),
                    mimeType: 'image/jpeg', // Altere para corresponder ao tipo da sua imagem
                },
            };
        };

        // Definindo o prompt em português para a primeira solicitação
        const promptPrimeiraSolicitacao = "Esta imagem contém comida?";
        // Definindo o prompt em português para a segunda solicitação
        const promptSegundaSolicitacao = "Informe a receita da comida e o nome da comida.";

        // Lendo a imagem do sistema de arquivos local
        const imagePath = './imagens/teste.jpeg'; // Caminho para a imagem
        const image = lerImagem(imagePath);

        // Primeira solicitação: Enviando a imagem para a IA para análise com o prompt em português
        const resultPrimeiraSolicitacao = await model.generateContent([promptPrimeiraSolicitacao, image]);

        // Processando a resposta da IA em português da primeira solicitação
        const responseTextPrimeiraSolicitacao = resultPrimeiraSolicitacao.response.text().toLowerCase();

        // Verificando se a resposta da IA é "Sim" ou "Não" na primeira solicitação
        if (responseTextPrimeiraSolicitacao.includes('sim')) {
            console.log('A imagem contém comida.');

            // Segunda solicitação: Novo prompt para a IA solicitando a receita da comida identificada na imagem
            const resultSegundaSolicitacao = await model.generateContent([promptSegundaSolicitacao, image]);
            const receita = resultSegundaSolicitacao.response.text();
            console.log(receita);
        } else if (responseTextPrimeiraSolicitacao.includes('não')) {
            console.log('A imagem não contém comida. Por favor, insira uma nova imagem.');
        } else {
            console.log('Não foi possível determinar se a imagem contém comida.');
        }
    } catch (error) {
        console.error('Erro ao analisar a imagem:', error);
    }
})();
