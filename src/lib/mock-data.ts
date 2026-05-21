// ============================================================
// AÇÃO TRADE ESTOQUE — Dados Mockados para Ambiente de Teste
// ============================================================

export const mockUser = {
  id: "usr_admin",
  name: "Carlos Administrador",
  email: "carlos@acaotrade.com.br",
  role: "ADMINISTRADOR" as const,
  initials: "CA",
};

export interface MockMaterial {
  id: string;
  name: string;
  category: string;
  quantity: number;
  daysInStock: number;
  status: "DISPONIVEL" | "RESERVADO" | "ESGOTADO";
  entryDate: string;
}

export const mockMaterials: MockMaterial[] = [
  {
    id: "MAT-001",
    name: "Banner Retratil 60x180",
    category: "Display",
    quantity: 45,
    daysInStock: 52,
    status: "DISPONIVEL",
    entryDate: "2026-03-29",
  },
  {
    id: "MAT-002",
    name: "Wobbler A5 Dupla Face",
    category: "PDV",
    quantity: 320,
    daysInStock: 12,
    status: "DISPONIVEL",
    entryDate: "2026-05-08",
  },
  {
    id: "MAT-003",
    name: "Totem de Chão Papelão",
    category: "Display",
    quantity: 18,
    daysInStock: 38,
    status: "RESERVADO",
    entryDate: "2026-04-12",
  },
  {
    id: "MAT-004",
    name: "Faixa de Gôndola 90cm",
    category: "PDV",
    quantity: 0,
    daysInStock: 65,
    status: "ESGOTADO",
    entryDate: "2026-03-16",
  },
  {
    id: "MAT-005",
    name: "Tablóide A4 Couchê 90g",
    category: "Impresso",
    quantity: 2800,
    daysInStock: 5,
    status: "DISPONIVEL",
    entryDate: "2026-05-15",
  },
  {
    id: "MAT-006",
    name: "Stopper de Prateleira",
    category: "PDV",
    quantity: 150,
    daysInStock: 44,
    status: "DISPONIVEL",
    entryDate: "2026-04-06",
  },
  {
    id: "MAT-007",
    name: "Kit Display Checkout",
    category: "Display",
    quantity: 22,
    daysInStock: 19,
    status: "DISPONIVEL",
    entryDate: "2026-05-01",
  },
  {
    id: "MAT-008",
    name: "Régua de Prateleira LED",
    category: "Iluminação",
    quantity: 8,
    daysInStock: 91,
    status: "RESERVADO",
    entryDate: "2026-02-18",
  },
];

export interface MockMovement {
  id: string;
  materialName: string;
  type: "ENTRADA" | "SAIDA";
  quantity: number;
  user: string;
  timeAgo: string;
  docStatus: "ASSINADO" | "AGUARDANDO";
  category: string;
}

export const mockMovements: MockMovement[] = [
  {
    id: "MOV-089",
    materialName: "Banner Retratil 60x180",
    type: "SAIDA",
    quantity: 10,
    user: "Ana Paula Silva",
    timeAgo: "há 25 minutos",
    docStatus: "ASSINADO",
    category: "Display",
  },
  {
    id: "MOV-088",
    materialName: "Tablóide A4 Couchê 90g",
    type: "ENTRADA",
    quantity: 3000,
    user: "Marcos Costa",
    timeAgo: "há 1 hora",
    docStatus: "ASSINADO",
    category: "Impresso",
  },
  {
    id: "MOV-087",
    materialName: "Wobbler A5 Dupla Face",
    type: "SAIDA",
    quantity: 50,
    user: "Juliana Ferreira",
    timeAgo: "há 2 horas",
    docStatus: "AGUARDANDO",
    category: "PDV",
  },
  {
    id: "MOV-086",
    materialName: "Totem de Chão Papelão",
    type: "SAIDA",
    quantity: 5,
    user: "Roberto Alves",
    timeAgo: "há 4 horas",
    docStatus: "AGUARDANDO",
    category: "Display",
  },
  {
    id: "MOV-085",
    materialName: "Stopper de Prateleira",
    type: "ENTRADA",
    quantity: 200,
    user: "Carlos Admin",
    timeAgo: "ontem, 16h30",
    docStatus: "ASSINADO",
    category: "PDV",
  },
  {
    id: "MOV-084",
    materialName: "Kit Display Checkout",
    type: "SAIDA",
    quantity: 8,
    user: "Fernanda Lima",
    timeAgo: "ontem, 14h15",
    docStatus: "ASSINADO",
    category: "Display",
  },
];

// Dados do gráfico de fluxo semanal
export const mockFlowData = [
  { day: "Seg", entradas: 120, saidas: 85 },
  { day: "Ter", entradas: 95, saidas: 140 },
  { day: "Qua", entradas: 210, saidas: 165 },
  { day: "Qui", entradas: 180, saidas: 90 },
  { day: "Sex", entradas: 75, saidas: 210 },
  { day: "Sáb", entradas: 30, saidas: 45 },
  { day: "Dom", entradas: 0, saidas: 15 },
];

// KPIs do dashboard
export const mockKpis = {
  totalItems: 3450,
  monthlyMovements: 124,
  avgDaysInStock: 14,
  pendingSignatures: 7,
};
