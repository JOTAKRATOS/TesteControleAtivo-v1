let bens = [];
let pendencias = [];
let scanning = false;

// Inicializar a câmera
function startCamera() {
    const video = document.getElementById('video');
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
    }).then(stream => {
        video.srcObject = stream;
        scanning = true;
    }).catch(err => {
        console.error("Erro ao acessar a câmera: " + err);
    });
}

// Função para carregar o arquivo Excel
function importExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // Extrai os números dos bens do Excel
        bens = jsonData.map(item => item['Numero_Bem']);  // Verifique o nome correto da coluna no Excel
        alert('Lista de bens importada com sucesso!');
    };
    reader.readAsArrayBuffer(file);
}

function verificarCodigo(codigo) {
    const resultElement = document.getElementById('result');
    const statusElement = document.getElementById('status');
    
    if (bens.includes(codigo)) {
        resultElement.textContent = `Bem ${codigo} OK`;
        statusElement.textContent = `Bem ${codigo} localizado`;
        const index = bens.indexOf(codigo);
        bens.splice(index, 1);  // Remove o bem da lista de bens localizados
    } else {
        resultElement.textContent = `Bem ${codigo} não localizado`;
        statusElement.textContent = `Bem ${codigo} adicionado à lista de pendências`;
        pendencias.push(codigo);  // Adiciona o bem à lista de pendências
    }
}

// Função para desenhar os quadrados ao redor do código de barras
function desenharQuadrados(localization, canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height);  // Limpar o canvas antes de desenhar
    context.strokeStyle = "green";
    context.lineWidth = 4;

    localization.forEach(pos => {
        const points = pos.cornerPoints;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.forEach((point, index) => {
            if (index > 0) {
                context.lineTo(point.x, point.y);
            }
        });
        context.closePath();
        context.stroke();
    });
}

// Função para iniciar o escaneamento de código de barras
function scanBarcode() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const codeReader = new ZXing.BrowserBarcodeReader();

    function scan() {
        if (scanning) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            codeReader.decodeFromVideoDevice(undefined, 'video', (result, err, controls) => {
                if (result) {
                    verificarCodigo(result.text);  // Código lido com sucesso
                    desenharQuadrados(result.barcodeResult.localizationResult, canvas, context);  // Desenha quadrados ao redor do código de barras
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error(err);  // Exibe outros erros, se houver
                }
            });
        }
    }
    scan();
}

// Evento para iniciar a leitura de códigos
document.getElementById('startScan').addEventListener('click', function() {
    startCamera();
    scanBarcode();
});

// Evento para importar o arquivo Excel
document.getElementById('fileInput').addEventListener('change', function(evt) {
    const file = evt.target.files[0];
    importExcel(file);
});

// Exibir pendências
document.getElementById('exportPendencias').addEventListener('click', function() {
    if (pendencias.length > 0) {
        alert(`Bens não localizados: ${pendencias.join(', ')}`);
    } else {
        alert('Todos os bens foram localizados!');
    }
});
