const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// Configurações
const UPLOADS_DIR = 'uploads/';
const API_KEY = 'AIzaSyBqDhQ-YeAKOOZb4TriJfDCig97KvD9wn0'; // Substitua pela sua chave de API

// Inicialização da IA
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

// Configuração do multer para processar o upload do arquivo
const upload = multer({ dest: UPLOADS_DIR });

// Rota para processar a imagem
app.post('/processar-imagem', upload.single('imagem'), async (req, res) => {
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

        // Lendo a imagem enviada pelo formulário
        const imagePath = req.file.path;
        const image = lerImagem(imagePath);

        // Prompt para análise da imagem
        const promptPrimeiraSolicitacao = "Esta imagem contém comida?";
        const promptSegundaSolicitacao = "Informe a receita da comida e o nome da comida.";

        // Primeira solicitação: Enviando a imagem para análise com o prompt em português
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

            // Enviando a resposta de volta para o frontend
            res.json({ resposta: 'A imagem contém comida.', receita });
        } else if (responseTextPrimeiraSolicitacao.includes('não')) {
            console.log('A imagem não contém comida. Por favor, insira uma nova imagem.');
            // Enviando a resposta de volta para o frontend
            res.json({ resposta: 'A imagem não contém comida. Por favor, insira uma nova imagem.' });
        } else {
            console.log('Não foi possível determinar se a imagem contém comida.');
            // Enviando a resposta de volta para o frontend
            res.json({ resposta: 'Não foi possível determinar se a imagem contém comida.' });
        }
    } catch (error) {
        console.error('Erro ao analisar a imagem:', error);
        res.status(500).json({ error: 'Erro ao analisar a imagem.' });
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});