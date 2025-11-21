const fs = require('fs');
const path = require('path');

// Leer agents.json existente
const agentsPath = path.join('.claude', 'agents.json');
const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));

// Nuevos agentes de dominio
const domainAgents = [
    {
        "name": "yukyu-specialist",
        "file": ".claude/domain-specialists/yukyu-specialist.md",
        "description": "Especialista en sistema de yukyu (有給休暇 - vacaciones pagadas) según ley laboral japonesa: cálculo, algoritmo LIFO, workflow de aprobaciones, reportes y compliance",
        "category": "domain-specialists",
        "proactive": false,
        "triggers": [
            "yukyu specialist",
            "yukyu-specialist",
            "vacaciones pagadas",
            "yukyu",
            "有給",
            "cálculo yukyu",
            "LIFO deduction",
            "ley laboral japonesa",
            "yukyu balance",
            "yukyu request"
        ],
        "dependencies": []
    },
    {
        "name": "employee-lifecycle-specialist",
        "file": ".claude/domain-specialists/employee-lifecycle-specialist.md",
        "description": "Especialista en ciclo de vida completo de empleados: Candidato → Nyuusha (入社) → Empleado → Asignación → Terminación. Maneja conversiones, documentos, tipos de empleado y asignaciones",
        "category": "domain-specialists",
        "proactive": false,
        "triggers": [
            "employee lifecycle specialist",
            "employee-lifecycle-specialist",
            "candidato a empleado",
            "nyuusha",
            "入社",
            "contratación",
            "employee type",
            "派遣社員",
            "staff",
            "contract worker",
            "terminación empleado",
            "factory assignment"
        ],
        "dependencies": []
    },
    {
        "name": "payroll-specialist",
        "file": ".claude/domain-specialists/payroll-specialist.md",
        "description": "Especialista en cálculo de nómina japonesa: salarios (jikyu/gekkyu), deducciones (seguros, impuestos, renta), timer cards, overtime, yukyu payment y reportes de payroll",
        "category": "domain-specialists",
        "proactive": false,
        "triggers": [
            "payroll specialist",
            "payroll-specialist",
            "cálculo nómina",
            "salario",
            "給与",
            "deducciones",
            "timer card",
            "タイムカード",
            "overtime",
            "時間外",
            "payslip",
            "給与明細",
            "jikyu",
            "時給"
        ],
        "dependencies": []
    }
];

// Verificar si ya existen
const existingNames = agentsData.agents.map(a => a.name);
const newAgents = domainAgents.filter(a => !existingNames.includes(a.name));

if (newAgents.length === 0) {
    console.log('⚠️  Todos los agentes de dominio ya están registrados');
} else {
    // Agregar nuevos agentes
    agentsData.agents.push(...newAgents);
    
    // Guardar agents.json actualizado
    fs.writeFileSync(agentsPath, JSON.stringify(agentsData, null, 2));
    
    console.log(`✅ ${newAgents.length} agentes de dominio registrados en agents.json:`);
    newAgents.forEach(a => console.log(`   - ${a.name}`));
}

console.log('\n📋 Total de agentes en el sistema:', agentsData.agents.length);
console.log('\n🎯 Agentes de dominio especializados (6 total):');
console.log('   1. 🏖️  yukyu-specialist (有給休暇システム)');
console.log('   2. 👥 employee-lifecycle-specialist (社員ライフサイクル)');
console.log('   3. 💰 payroll-specialist (給与計算)');
console.log('   4. 🏢 apartment-specialist (寮管理)');
console.log('   5. 📋 candidate-specialist (候補者・OCR)');
console.log('   6. 🏭 factory-assignment-specialist (派遣先配属)');
