const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// ===============================
// CONFIGURAÇÕES
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Banco de dados
const DB_FILE = path.join(__dirname, "db.json");

// ===============================
// BANCO DE DADOS
// ===============================

const DB_PADRAO = {
  usuarios: [],
  pacientes: [],
  triagens: [],
  consultas: []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(DB_PADRAO, null, 2)
      );

      return { ...DB_PADRAO };
    }

    const arquivo = fs.readFileSync(DB_FILE, "utf8");

    if (!arquivo.trim()) {
      return { ...DB_PADRAO };
    }

    const db = JSON.parse(arquivo);

    return {
      usuarios: Array.isArray(db.usuarios) ? db.usuarios : [],
      pacientes: Array.isArray(db.pacientes) ? db.pacientes : [],
      triagens: Array.isArray(db.triagens) ? db.triagens : [],
      consultas: Array.isArray(db.consultas) ? db.consultas : []
    };
  } catch (error) {
    console.error("Erro ao ler banco de dados:", error);

    return { ...DB_PADRAO };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error("Erro ao salvar banco de dados:", error);
    return false;
  }
}

// ===============================
// ROTA PRINCIPAL
// ===============================

app.get("/", (req, res) => {
  const indexPath = path.join(
    __dirname,
    "../frontend/index.html"
  );

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.json({
    sistema: "Sentinela",
    status: "online"
  });
});

// ===============================
// STATUS DA API
// ===============================

app.get("/status", (req, res) => {
  res.json({
    sistema: "Sentinela",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({
        erro: "Usuário e senha são obrigatórios"
      });
    }

    const db = readDB();

    const user = db.usuarios.find(
      (u) =>
        u.usuario === usuario &&
        u.senha === senha
    );

    if (!user) {
      return res.status(401).json({
        erro: "Login inválido"
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro no login:", error);

    res.status(500).json({
      erro: "Erro interno no servidor"
    });
  }
});

// ===============================
// ATENDIMENTO
// ===============================

app.post("/atendimento", (req, res) => {
  try {
    const db = readDB();

    const paciente = {
      id: Date.now(),
      nome: req.body.nome || "",
      cpf: req.body.cpf || "",
      tipo: req.body.tipo || "",
      status: "triagem",
      createdAt: new Date().toISOString()
    };

    db.pacientes.push(paciente);

    if (!writeDB(db)) {
      return res.status(500).json({
        erro: "Não foi possível salvar o paciente"
      });
    }

    res.status(201).json(paciente);
  } catch (error) {
    console.error("Erro no atendimento:", error);

    res.status(500).json({
      erro: "Erro interno no servidor"
    });
  }
});

// ===============================
// LISTAR PACIENTES
// ===============================

app.get("/pacientes", (req, res) => {
  try {
    const db = readDB();

    res.json(db.pacientes);
  } catch (error) {
    console.error("Erro ao listar pacientes:", error);

    res.status(500).json({
      erro: "Erro ao carregar pacientes"
    });
  }
});

// ===============================
// TRIAGEM
// ===============================

app.post("/triagem", (req, res) => {
  try {
    const db = readDB();

    const temperatura =
      req.body.temperatura !== undefined &&
      req.body.temperatura !== ""
        ? Number(req.body.temperatura)
        : null;

    let risco = req.body.risco;

    // Classificação automática
    if (temperatura !== null && temperatura >= 39) {
      risco = "vermelho";
    } else if (
      temperatura !== null &&
      temperatura >= 38
    ) {
      risco = "amarelo";
    } else if (!risco) {
      risco = "verde";
    }

    const triagem = {
      id: Date.now(),
      nome: req.body.nome || "",
      sintoma: req.body.sintoma || "",
      temperatura,
      alergia: req.body.alergia || "",
      observacao: req.body.observacao || "",
      risco,
      status: "aguardando_medico",
      createdAt: new Date().toISOString()
    };

    db.triagens.push(triagem);

    if (!writeDB(db)) {
      return res.status(500).json({
        erro: "Não foi possível salvar a triagem"
      });
    }

    res.status(201).json(triagem);
  } catch (error) {
    console.error("Erro na triagem:", error);

    res.status(500).json({
      erro: "Erro interno no servidor"
    });
  }
});

// ===============================
// LISTAR TRIAGENS
// ===============================

app.get("/triagens", (req, res) => {
  try {
    const db = readDB();

    res.json(db.triagens);
  } catch (error) {
    console.error("Erro ao listar triagens:", error);

    res.status(500).json({
      erro: "Erro ao carregar triagens"
    });
  }
});

// ===============================
// LISTA DE MEDICAÇÕES
// ===============================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// ===============================
// CONSULTA MÉDICA
// ===============================

app.post("/consulta", (req, res) => {
  try {
    const db = readDB();

    const consulta = {
      id: Date.now(),
      paciente: req.body.paciente || "",
      diagnostico: req.body.diagnostico || "",
      medicacao: req.body.medicacao || "",
      obs: req.body.obs || "",
      createdAt: new Date().toISOString()
    };

    db.consultas.push(consulta);

    if (!writeDB(db)) {
      return res.status(500).json({
        erro: "Não foi possível salvar a consulta"
      });
    }

    res.status(201).json(consulta);
  } catch (error) {
    console.error("Erro na consulta:", error);

    res.status(500).json({
      erro: "Erro interno no servidor"
    });
  }
});

// ===============================
// MEDICAÇÕES / CONSULTAS
// ===============================

app.get("/medicacoes", (req, res) => {
  try {
    const db = readDB();

    res.json(db.consultas);
  } catch (error) {
    console.error("Erro ao listar medicações:", error);

    res.status(500).json({
      erro: "Erro ao carregar medicações"
    });
  }
});

// ===============================
// LISTAR CONSULTAS
// ===============================

app.get("/consultas", (req, res) => {
  try {
    const db = readDB();

    res.json(db.consultas);
  } catch (error) {
    console.error("Erro ao listar consultas:", error);

    res.status(500).json({
      erro: "Erro ao carregar consultas"
    });
  }
});

// ===============================
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ===============================

app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada",
    rota: req.originalUrl
  });
});

// ===============================
// TRATAMENTO DE ERROS
// ===============================

app.use((err, req, res, next) => {
  console.error("Erro no servidor:", err);

  res.status(500).json({
    erro: "Erro interno no servidor"
  });
});

// ===============================
// INICIAR SERVIDOR
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sentinela iniciado na porta ${PORT}`);
});
