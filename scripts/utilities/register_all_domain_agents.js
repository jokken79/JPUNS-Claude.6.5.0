const fs = require('fs');
const path = require('path');

// Leer agents.json existente
const agentsPath = path.join('.claude', 'agents.json');
const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));

// TODOS los agentes de dominio (6 total)
const allDomainAgents = [
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
    },
    {
        "name": "apartment-specialist",
        "file": ".claude/domain-specialists/apartment-specialist.md",
        "description": "Especialista en gestión de apartamentos y asignaciones: disponibilidad, rentas, deducciones en payroll, mantenimiento, reportes de ocupación y sistema V2",
        "category": "domain-specialists",
        "proactive": false,
        "triggers": [
            "apartment specialist",
            "apartment-specialist",
            "apartamento",
            "寮",
            "apartment assignment",
            "renta",
            "寮費",
            "room type",
            "occupancy",
            "apartment v2"
        ],
        "dependencies": []
    },
    {
        "name": "candidate-specialist",
        "file": ".claude/domain-specialists/candidate-specialist.md",
        "description": "Especialista en proceso de candidatos: OCR de rirekisho (履歴書), validación de documentos, Azure OCR + fallbacks, proceso de aprobación y conversión a empleado",
        "category": "domain-specialists",
        "proactive": false,
        "triggers": [
            "candidate specialist",
            "candidate-specialist",
            "candidato",
            "rirekisho",
            "履歴書",
            "OCR",
            "zairyu card",
            "在留カード",
            "candidate approval",
            "azure ocr",
            "photo extraction"
        ],
        "dependencies": []
    },
    {
        "name": "factory-assignment-specialist",
        "file": ".claude/domain-specialists/factory-assignment-specialist.md",
        "description": "Especialista en asignaciones a empresas clientes (派遣先): asignación de empleados, gestión de turnos (朝番/昼番/夜番), rotación, reportes por cliente",
        "category": "domain-specialists",
        "proactive": false,
        "triggers": [
            "factory assignment specialist",
            "factory-assignment-specialist",
            "asignación fábrica",
            "派遣先",
            "factory",
            "shift",
            "朝番",
            "昼番",
            "夜番",
            "client assignment",
            "rotation"
        ],
        "dependencies": []
    }
];

// Verificar cuáles ya existen
const existingNames = agentsData.agents.map(a => a.name);
const newAgents = allDomainAgents.filter(a => !existingNames.includes(a.name));

if (newAgents.length === 0) {
    console.log('⚠️  Todos los agentes de dominio ya están registrados');
    console.log('📋 Total de agentes en el sistema:', agentsData.agents.length);
} else {
    // Agregar nuevos agentes
    agentsData.agents.push(...newAgents);
    
    // Guardar agents.json actualizado
    fs.writeFileSync(agentsPath, JSON.stringify(agentsData, null, 2));
    
    console.log('='.repeat(60));
    console.log(`✅ ${newAgents.length} agentes de dominio registrados en agents.json:`);
    newAgents.forEach(a => console.log(`   - ${a.name}`));
    console.log('='.repeat(60));
}

console.log('\n📋 Total de agentes en el sistema:', agentsData.agents.length);
console.log('\n🎯 Agentes de dominio especializados (6 total):');
console.log('   1. 🏖️  yukyu-specialist (有給休暇システム)');
console.log('   2. 👥 employee-lifecycle-specialist (社員ライフサイクル)');
console.log('   3. 💰 payroll-specialist (給与計算)');
console.log('   4. 🏢 apartment-specialist (寮管理)');
console.log('   5. 📋 candidate-specialist (候補者・OCR)');
console.log('   6. 🏭 factory-assignment-specialist (派遣先配属)');
