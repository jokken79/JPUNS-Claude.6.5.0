const fs = require('fs');
const path = require('path');

// Leer agents.json existente
const agentsPath = path.join('.claude', 'agents.json');
const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));

// Nuevos agentes elite
const eliteAgents = [
    {
        "name": "master-problem-solver",
        "file": ".claude/elite/master-problem-solver.md",
        "description": "Elite problem solver que maneja problemas complejos técnicos y de negocio, debugging multi-capa, decisiones arquitectónicas críticas y optimización de sistemas completos",
        "category": "elite",
        "proactive": false,
        "triggers": [
            "master problem solver",
            "master-problem-solver",
            "problema complejo",
            "bug imposible",
            "debugging avanzado",
            "root cause",
            "optimización sistema",
            "análisis profundo"
        ],
        "dependencies": []
    },
    {
        "name": "full-stack-architect",
        "file": ".claude/elite/full-stack-architect.md",
        "description": "Elite full-stack architect que diseña e implementa sistemas completos end-to-end, desde database hasta UI, con best practices en Python/FastAPI, React/Next.js y PostgreSQL",
        "category": "elite",
        "proactive": false,
        "triggers": [
            "full stack architect",
            "full-stack-architect",
            "arquitectura completa",
            "diseñar feature",
            "sistema end-to-end",
            "api design",
            "implementar feature"
        ],
        "dependencies": []
    },
    {
        "name": "code-quality-guardian",
        "file": ".claude/elite/code-quality-guardian.md",
        "description": "Elite code reviewer que asegura calidad, maintainability y best practices mediante revisión exhaustiva de código, detección de code smells, anti-patterns y mejora de test coverage",
        "category": "elite",
        "proactive": false,
        "triggers": [
            "code quality guardian",
            "code-quality-guardian",
            "revisar código",
            "code review",
            "mejorar calidad",
            "refactorizar",
            "code smell",
            "test coverage"
        ],
        "dependencies": []
    }
];

// Verificar si ya existen
const existingNames = agentsData.agents.map(a => a.name);
const newAgents = eliteAgents.filter(a => !existingNames.includes(a.name));

if (newAgents.length === 0) {
    console.log('⚠️  Todos los agentes elite ya están registrados');
} else {
    // Agregar nuevos agentes
    agentsData.agents.push(...newAgents);
    
    // Guardar agents.json actualizado
    fs.writeFileSync(agentsPath, JSON.stringify(agentsData, null, 2));
    
    console.log(`✅ ${newAgents.length} agentes elite registrados en agents.json:`);
    newAgents.forEach(a => console.log(`   - ${a.name}`));
}

console.log('\n📋 Total de agentes en el sistema:', agentsData.agents.length);
