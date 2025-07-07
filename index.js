// index.js - Backend Node.js com Express e Mongoose
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MercadoPagoConfig, PreApprovalPlan, PreApproval, Preference, Payment } = require('mercadopago');
const moment = require('moment'); // Para manipulação de datas

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET; // Use uma chave forte em produção
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Em produção, considere restringir a domínios específicos
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Conexão com o MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_barbershop';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- Configuração do Mercado Pago ---
const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN,
    options: {
        timeout: 5000
    }
});

const preApprovalPlan = new PreApprovalPlan(client);
const preApproval = new PreApproval(client);
const preferenceService = new Preference(client);
const paymentService = new Payment(client);

// --- Schemas e Modelos Mongoose ---

// Schema de Usuário (para Estabelecimentos e Funcionários)
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['establishment', 'employee'], required: true },
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', default: null },
    planoAtivo: { type: Boolean, default: false }, // MOVIDO PARA CÁ
    dataExpiracaoPlano: { type: Date, default: null } // MOVIDO PARA CÁ
});
const User = mongoose.model('User', UserSchema);

// Schema de Estabelecimento
const EstablishmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    description: { type: String },
    publicLink: { type: String, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    // planoAtivo e dataExpiracaoPlano REMOVIDOS daqui
});

// Pré-salvamento para gerar o publicLink
EstablishmentSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.publicLink = `/${this._id.toString()}`;
    }
    next();
});
const Establishment = mongoose.model('Establishment', EstablishmentSchema);

// Schema de Funcionário
const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String },
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});
const Employee = mongoose.model('Employee', EmployeeSchema);

// Schema de Serviço
const ServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // Duração em minutos
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', required: true }
});
const Service = mongoose.model('Service', ServiceSchema);

// Novo Schema para Disponibilidade do Funcionário
const AvailabilitySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true }, // Um registro por funcionário
    days: [{
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Domingo, 6 = Sábado
        intervals: [{
            start: { type: String, required: true }, // Ex: "09:00"
            end: { type: String, required: true }    // Ex: "18:00"
        }]
    }]
});
const Availability = mongoose.model('Availability', AvailabilitySchema);

// Schema de Agendamento
const AppointmentSchema = new mongoose.Schema({
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }], // Pode ter múltiplos serviços
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true }, // Valor total dos serviços
    paymentId: { type: String, default: null }, // ID do pagamento do Mercado Pago
    status: { type: String, enum: ['pending_payment', 'confirmed', 'completed', 'cancelled'], default: 'pending_payment' } // Status do agendamento
});
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// --- Middleware de Autenticação JWT ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
};

// --- Rotas de Autenticação ---

// Rota de Registro (para Estabelecimento ou Funcionário)
app.post('/api/register', async (req, res) => {
    const { email, password, role, establishmentId } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, senha e papel são obrigatórios.' });
    }

    if (role === 'employee' && !establishmentId) {
        return res.status(400).json({ message: 'Funcionários devem ser associados a um estabelecimento existente.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Usuário com este email já existe.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, role, establishmentId: role === 'employee' ? establishmentId : null });
        await newUser.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: newUser._id });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                establishmentId: user.establishmentId,
                planoAtivo: user.planoAtivo, // Adicionado
                dataExpiracaoPlano: user.dataExpiracaoPlano // Adicionado
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            role: user.role,
            establishmentId: user.establishmentId,
            planoAtivo: user.planoAtivo, // Adicionado
            dataExpiracaoPlano: user.dataExpiracaoPlano // Adicionado
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Estabelecimento (Protegidas) ---

// Criar Perfil de Estabelecimento (apenas para usuários com role 'establishment')
app.post('/api/establishments', authenticateToken, async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas estabelecimentos podem criar perfis.' });
    }
    if (req.user.establishmentId) {
        return res.status(409).json({ message: 'Este usuário já possui um estabelecimento associado.' });
    }

    const { name, address, phone, description } = req.body;

    try {
        const newEstablishment = new Establishment({
            name,
            address,
            phone,
            description,
            ownerId: req.user.userId
        });
        await newEstablishment.save();

        // Atualiza o usuário para vincular ao estabelecimento recém-criado
        await User.findByIdAndUpdate(req.user.userId, { establishmentId: newEstablishment._id });

        // A URL pública agora é apenas um identificador, o frontend irá construí-la
        res.status(201).json({
            message: 'Perfil de estabelecimento criado com sucesso!',
            establishment: newEstablishment,
            publicLink: newEstablishment.publicLink // Retorna apenas o sufixo
        });
    } catch (error) {
        console.error('Erro ao criar estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter Perfil de Estabelecimento (protegido para o proprietário ou funcionário)
app.get('/api/establishments/:id', authenticateToken, async (req, res) => {
    try {
        const establishment = await Establishment.findById(req.params.id);

        if (!establishment) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário ou um funcionário deste estabelecimento
        if (req.user.role === 'establishment' && req.user.userId.toString() !== establishment.ownerId.toString()) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        if (req.user.role === 'employee' && req.user.establishmentId.toString() !== establishment._id.toString()) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        res.json(establishment);
    } catch (error) {
        console.error('Erro ao obter estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar Perfil de Estabelecimento (apenas para o proprietário)
app.put('/api/establishments/:id', authenticateToken, async (req, res) => {
    try {
        const establishment = await Establishment.findById(req.params.id);

        if (!establishment) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário
        if (req.user.role !== 'establishment' || req.user.userId.toString() !== establishment.ownerId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode atualizar.' });
        }

        const updatedEstablishment = await Establishment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({ message: 'Perfil de estabelecimento atualizado com sucesso!', establishment: updatedEstablishment });
    } catch (error) {
        console.error('Erro ao atualizar estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Funcionários (Protegidas) ---

// Adicionar Funcionário
app.post('/api/employees', authenticateToken, async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas estabelecimentos podem adicionar funcionários.' });
    }
    if (!req.user.establishmentId) {
        return res.status(400).json({ message: 'O usuário não está associado a um estabelecimento.' });
    }

    const { name, email, phone, userId } = req.body;

    try {
        const newEmployee = new Employee({
            name,
            email,
            phone,
            establishmentId: req.user.establishmentId,
            userId: userId || null
        });
        await newEmployee.save();
        res.status(201).json({ message: 'Funcionário adicionado com sucesso!', employee: newEmployee });
    } catch (error) {
        console.error('Erro ao adicionar funcionário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter Funcionários de um Estabelecimento
app.get('/api/employees/:establishmentId', authenticateToken, async (req, res) => {
    // Permite que o proprietário ou um funcionário do estabelecimento veja a lista
    if (req.user.establishmentId.toString() !== req.params.establishmentId.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const employees = await Employee.find({ establishmentId: req.params.establishmentId });
        res.json(employees);
    } catch (error) {
        console.error('Erro ao obter funcionários:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar Funcionário
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Funcionário não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário do estabelecimento do funcionário
        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== employee.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode atualizar funcionários.' });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ message: 'Funcionário atualizado com sucesso!', employee: updatedEmployee });
    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Deletar Funcionário
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Funcionário não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário do estabelecimento do funcionário
        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== employee.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode deletar funcionários.' });
        }

        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Funcionário deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar funcionário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Disponibilidade (Protegidas para o proprietário) ---

// Definir/Atualizar Disponibilidade de um Funcionário
app.post('/api/availability', authenticateToken, async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas proprietários de estabelecimentos podem definir disponibilidade.' });
    }
    const { employeeId, days } = req.body;

    if (!employeeId || !days) {
        return res.status(400).json({ message: 'ID do funcionário e dias de disponibilidade são obrigatórios.' });
    }

    try {
        const employee = await Employee.findById(employeeId);
        if (!employee || employee.establishmentId.toString() !== req.user.establishmentId.toString()) {
            return res.status(403).json({ message: 'Funcionário não encontrado ou não pertence ao seu estabelecimento.' });
        }

        const availability = await Availability.findOneAndUpdate(
            { employeeId: employeeId },
            { $set: { days: days } },
            { upsert: true, new: true } // Cria se não existir, atualiza se existir
        );
        res.status(200).json({ message: 'Disponibilidade atualizada com sucesso!', availability });
    } catch (error) {
        console.error('Erro ao definir disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter Disponibilidade de um Funcionário (para o proprietário ou público)
app.get('/api/availability/:employeeId', async (req, res) => {
    try {
        const availability = await Availability.findOne({ employeeId: req.params.employeeId });
        if (!availability) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada para este funcionário.' });
        }
        res.json(availability);
    } catch (error) {
        console.error('Erro ao obter disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Serviços (Protegidas) ---

// Adicionar Serviço
app.post('/api/services', authenticateToken, async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas estabelecimentos podem adicionar serviços.' });
    }
    if (!req.user.establishmentId) {
        return res.status(400).json({ message: 'O usuário não está associado a um estabelecimento.' });
    }

    const { name, price, duration } = req.body;

    try {
        const newService = new Service({
            name,
            price,
            duration,
            establishmentId: req.user.establishmentId
        });
        await newService.save();
        res.status(201).json({ message: 'Serviço adicionado com sucesso!', service: newService });
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter Serviços de um Estabelecimento
app.get('/api/services/:establishmentId', authenticateToken, async (req, res) => {
    // Permite que o proprietário ou um funcionário do estabelecimento veja a lista
    if (req.user.establishmentId.toString() !== req.params.establishmentId.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const services = await Service.find({ establishmentId: req.params.establishmentId });
        res.json(services);
    } catch (error) {
        console.error('Erro ao obter serviços:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar Serviço
app.put('/api/services/:id', authenticateToken, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário do estabelecimento do serviço
        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== service.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode atualizar serviços.' });
        }

        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ message: 'Serviço atualizado com sucesso!', service: updatedService });
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Deletar Serviço
app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário do estabelecimento do serviço
        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== service.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode deletar serviços.' });
        }

        await Service.findByIdAndDelete(req.params.id);
        res.json({ message: 'Serviço deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Agendamento (Públicas e Protegidas) ---

// Rota para obter detalhes do estabelecimento para a página pública de agendamento (NÃO PROTEGIDA)
app.get('/api/public/establishment/:establishmentId', async (req, res) => {
    try {
        const establishment = await Establishment.findById(req.params.establishmentId);
        if (!establishment) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }
        const services = await Service.find({ establishmentId: req.params.establishmentId });
        const employees = await Employee.find({ establishmentId: req.params.establishmentId });
        res.json({ establishment, services, employees });
    } catch (error) {
        console.error('Erro ao obter detalhes públicos do estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para verificar horários disponíveis para um funcionário em uma data específica
app.get('/api/public/available-times/:employeeId/:date', async (req, res) => {
    const { employeeId, date } = req.params;
    const selectedDate = moment(date).startOf('day'); // Início do dia para a data selecionada

    try {
        const employeeAvailability = await Availability.findOne({ employeeId: employeeId });
        if (!employeeAvailability) {
            return res.status(404).json({ message: 'Disponibilidade não configurada para este funcionário.' });
        }

        const dayOfWeek = selectedDate.day(); // 0 (Domingo) a 6 (Sábado)
        const dayAvailability = employeeAvailability.days.find(d => d.dayOfWeek === dayOfWeek);

        if (!dayAvailability) {
            return res.json({ availableTimes: [], message: 'Funcionário não disponível neste dia da semana.' });
        }

        const existingAppointments = await Appointment.find({
            employeeId: employeeId,
            appointmentDate: {
                $gte: selectedDate.toDate(),
                $lt: moment(selectedDate).endOf('day').toDate()
            },
            status: { $in: ['pending_payment', 'confirmed'] } // Considera agendamentos pendentes de pagamento e confirmados
        }).populate('serviceIds', 'duration');

        const bookedSlots = [];
        existingAppointments.forEach(appointment => {
            const start = moment(appointment.appointmentDate);
            const totalDuration = appointment.serviceIds.reduce((sum, service) => sum + service.duration, 0);
            const end = moment(start).add(totalDuration, 'minutes');
            bookedSlots.push({ start, end });
        });

        const availableTimes = [];
        dayAvailability.intervals.forEach(interval => {
            let currentSlot = moment(selectedDate).hour(moment(interval.start, 'HH:mm').hour()).minute(moment(interval.start, 'HH:mm').minute());
            const endOfInterval = moment(selectedDate).hour(moment(interval.end, 'HH:mm').hour()).minute(moment(interval.end, 'HH:mm').minute());

            // Garante que o slot inicial não está no passado
            if (currentSlot.isBefore(moment())) {
                currentSlot = moment(); // Começa do horário atual
                // Arredonda para o próximo slot de 30 minutos
                const remainder = currentSlot.minute() % 30;
                if (remainder !== 0) {
                    currentSlot.add(30 - remainder, 'minutes');
                }
            }


            while (currentSlot.isBefore(endOfInterval)) {
                const potentialEndTime = moment(currentSlot).add(30, 'minutes'); // Assume slots de 30 minutos, ajustar conforme necessário

                // Se o slot potencial ultrapassar o fim do intervalo de disponibilidade, ajusta
                if (potentialEndTime.isAfter(endOfInterval)) {
                    break; // Não adiciona slots parciais ou que excedam o fim do intervalo
                }

                let isConflict = false;
                for (const booked of bookedSlots) {
                    // Verifica se o slot potencial se sobrepõe a um slot já agendado
                    if (currentSlot.isBefore(booked.end) && potentialEndTime.isAfter(booked.start)) {
                        isConflict = true;
                        break;
                    }
                }

                if (!isConflict) {
                    availableTimes.push(currentSlot.format('HH:mm'));
                }
                currentSlot = potentialEndTime;
            }
        });

        res.json({ availableTimes });

    } catch (error) {
        console.error('Erro ao verificar horários disponíveis:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


// Rota para INICIAR o Agendamento e Pagamento (PÚBLICA - cliente não precisa de conta)
app.post('/api/public/appointments/initiate-payment', async (req, res) => {
    const { establishmentId, employeeId, serviceIds, clientName, clientPhone, appointmentDate, redirectBaseUrl } = req.body;

    if (!establishmentId || !employeeId || !serviceIds || serviceIds.length === 0 || !clientName || !clientPhone || !appointmentDate || !redirectBaseUrl) {
        return res.status(400).json({ message: 'Todos os campos de agendamento e serviços são obrigatórios, incluindo redirectBaseUrl.' });
    }

    try {
        // 1. Valida se o estabelecimento, funcionário e serviços existem e pertencem ao mesmo estabelecimento
        const establishment = await Establishment.findById(establishmentId);
        const employee = await Employee.findById(employeeId);
        const services = await Service.find({ _id: { $in: serviceIds } });

        if (!establishment || !employee || services.length !== serviceIds.length ||
            employee.establishmentId.toString() !== establishmentId.toString() ||
            services.some(s => s.establishmentId.toString() !== establishmentId.toString())) {
            return res.status(400).json({ message: 'Dados de agendamento inválidos (estabelecimento, funcionário ou serviços não encontrados/associados).' });
        }

        // 2. Calcula a duração total e o valor total dos serviços
        let totalDuration = 0;
        let totalAmount = 0;
        services.forEach(service => {
            totalDuration += service.duration;
            totalAmount += service.price;
        });

        // 3. Verifica a disponibilidade do funcionário e conflitos de horário
        const requestedMoment = moment(appointmentDate);
        const dayOfWeek = requestedMoment.day();
        const employeeAvailability = await Availability.findOne({ employeeId: employeeId });

        if (!employeeAvailability) {
            return res.status(400).json({ message: 'Disponibilidade não configurada para este funcionário.' });
        }

        const dayAvailability = employeeAvailability.days.find(d => d.dayOfWeek === dayOfWeek);
        if (!dayAvailability) {
            return res.status(400).json({ message: 'Funcionário não disponível neste dia da semana.' });
        }

        let isTimeWithinAvailability = false;
        for (const interval of dayAvailability.intervals) {
            const intervalStart = moment(appointmentDate).hour(moment(interval.start, 'HH:mm').hour()).minute(moment(interval.start, 'HH:mm').minute());
            const intervalEnd = moment(appointmentDate).hour(moment(interval.end, 'HH:mm').hour()).minute(moment(interval.end, 'HH:mm').minute());
            const appointmentEnd = moment(requestedMoment).add(totalDuration, 'minutes');

            if (requestedMoment.isSameOrAfter(intervalStart) && appointmentEnd.isSameOrBefore(intervalEnd)) {
                isTimeWithinAvailability = true;
                break;
            }
        }

        if (!isTimeWithinAvailability) {
            return res.status(409).json({ message: 'Horário fora da disponibilidade do funcionário.' });
        }

        // Verifica conflitos com agendamentos existentes
        const existingAppointments = await Appointment.find({
            employeeId: employeeId,
            appointmentDate: {
                $gte: moment(requestedMoment).subtract(totalDuration, 'minutes').toDate(), // Verifica conflitos que começam antes
                $lt: moment(requestedMoment).add(totalDuration, 'minutes').toDate() // Verifica conflitos que terminam depois
            },
            status: { $in: ['pending_payment', 'confirmed'] } // Considera agendamentos pendentes de pagamento e confirmados
        }).populate('serviceIds', 'duration');

        for (const existingApp of existingAppointments) {
            const existingAppStart = moment(existingApp.appointmentDate);
            const existingAppTotalDuration = existingApp.serviceIds.reduce((sum, service) => sum + service.duration, 0);
            const existingAppEnd = moment(existingAppStart).add(existingAppTotalDuration, 'minutes');

            // Verifica se há sobreposição de horários
            if (requestedMoment.isBefore(existingAppEnd) && moment(requestedMoment).add(totalDuration, 'minutes').isAfter(existingAppStart)) {
                return res.status(409).json({ message: 'Horário indisponível para este funcionário devido a outro agendamento. Por favor, escolha outro.' });
            }
        }

        // 4. Cria um agendamento temporário com status 'pending_payment'
        const newAppointment = new Appointment({
            establishmentId,
            employeeId,
            serviceIds,
            clientName,
            clientPhone,
            appointmentDate: requestedMoment.toDate(),
            totalAmount: totalAmount,
            status: 'pending_payment'
        });
        await newAppointment.save();

        // 5. Cria a preferência de pagamento no Mercado Pago
        const preference = await preferenceService.create({
            body: {
                items: services.map(s => ({
                    title: s.name,
                    quantity: 1,
                    unit_price: parseFloat(s.price.toFixed(2)), // Garante 2 casas decimais
                    currency_id: "BRL"
                })),
                payer: {
                    name: clientName,
                    email: "test_user_123@test.com" // Use um email real do cliente em produção
                },
                // As URLs de retorno agora dependem do frontend que as envia
                back_urls: {
                    success: `${redirectBaseUrl}/payment-success`,
                    failure: `${redirectBaseUrl}/payment-failure`,
                    pending: `${redirectBaseUrl}/payment-pending`
                },
                auto_return: "approved",
                external_reference: newAppointment._id.toString(), // Usa o ID do agendamento como referência externa
                notification_url: `${req.protocol}://${req.get('host')}/api/mercadopago/webhook` // Webhook para pagamentos (o mesmo para pré-aprovação e pagamento único)
            }
        });

        // Retorna a URL de pagamento do Mercado Pago para o frontend
        res.status(200).json({
            message: 'Agendamento iniciado. Redirecione para o Mercado Pago para completar o pagamento.',
            paymentLink: preference.init_point,
            appointmentId: newAppointment._id
        });

    } catch (error) {
        console.error('Erro ao iniciar agendamento e pagamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


// Obter Agendamentos para um Estabelecimento (Protegida)
app.get('/api/appointments/:establishmentId', authenticateToken, async (req, res) => {
    // Permite que o proprietário ou um funcionário do estabelecimento veja a lista
    if (req.user.establishmentId.toString() !== req.params.establishmentId.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const appointments = await Appointment.find({ establishmentId: req.params.establishmentId })
            .populate('employeeId', 'name')
            .populate('serviceIds', 'name price'); // Popula múltiplos serviços
        res.json(appointments);
    } catch (error) {
        console.error('Erro ao obter agendamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar Status de Agendamento (Protegida)
app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
    const { status } = req.body;
    if (!['pending_payment', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }

    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        // Verifica se o usuário logado é o proprietário ou funcionário do estabelecimento do agendamento
        if (req.user.establishmentId.toString() !== appointment.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        appointment.status = status;
        await appointment.save();
        res.json({ message: 'Status do agendamento atualizado com sucesso!', appointment });
    } catch (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Assinatura Mercado Pago ---

// Rota para criar plano mensal (protegida para o proprietário do estabelecimento)
app.post('/api/subscriptions/monthly', authenticateToken, async (req, res) => {
    // A validação de role 'establishment' já foi feita pelo authenticateToken
    if (!req.user.userId) { // Certifica-se de que o userId está no token
        return res.status(400).json({ message: 'ID do usuário não encontrado no token.' });
    }

    const userId = req.user.userId;
    const { redirectBaseUrl } = req.body; // O frontend deve enviar esta URL

    if (!redirectBaseUrl) {
        return res.status(400).json({ message: 'A URL de redirecionamento (redirectBaseUrl) é obrigatória.' });
    }

    try {
        const response = await preApprovalPlan.create({
            body: {
                reason: "Assinatura Mensal de Serviço para Estabelecimento",
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 99.90, // Valor mensal
                    currency_id: "BRL"
                },
                back_url: `${redirectBaseUrl}/subscription-status`, // Redireciona para uma rota no frontend
                external_reference: `plano_mensal_user_${userId}`, // Referência externa com o ID do USUÁRIO
                status: "active"
            }
        });

        return res.json({ init_point: response.init_point });
    } catch (error) {
        console.error("Erro ao criar plano mensal:", error.message || error);
        return res.status(500).json({ message: "Erro ao criar plano mensal." });
    }
});

// Rota para criar plano anual (protegida para o proprietário do estabelecimento)
app.post('/api/subscriptions/annual', authenticateToken, async (req, res) => {
    // A validação de role 'establishment' já foi feita pelo authenticateToken
    if (!req.user.userId) { // Certifica-se de que o userId está no token
        return res.status(400).json({ message: 'ID do usuário não encontrado no token.' });
    }

    const userId = req.user.userId;
    const { redirectBaseUrl } = req.body; // O frontend deve enviar esta URL

    if (!redirectBaseUrl) {
        return res.status(400).json({ message: 'A URL de redirecionamento (redirectBaseUrl) é obrigatória.' });
    }

    try {
        const response = await preApprovalPlan.create({
            body: {
                reason: "Assinatura Anual de Serviço para Estabelecimento",
                auto_recurring: {
                    frequency: 12,
                    frequency_type: "months",
                    transaction_amount: 700.00, // Valor anual
                    currency_id: "BRL"
                },
                back_url: `${redirectBaseUrl}/subscription-status`, // Redireciona para uma rota no frontend
                external_reference: `plano_anual_user_${userId}`, // Referência externa com o ID do USUÁRIO
                status: "active"
            }
        });

        return res.json({ init_point: response.init_point });
    } catch (error) {
        console.error("Erro ao criar plano anual:", error.message || error);
        return res.status(500).json({ message: "Erro ao criar plano anual." });
    }
});

// Rota para o Webhook do Mercado Pago (NÃO PROTEGIDA - Mercado Pago irá chamar esta rota)
app.post('/api/mercadopago/webhook', async (req, res) => {
    const { type, data } = req.body;

    console.log("Webhook recebido:", type, data);

    try {
        // !!! IMPORTANTE: Validação da assinatura do webhook (altamente recomendável para segurança) !!!
        // O Mercado Pago envia um header 'x-signature' que você deve validar para garantir que a requisição
        // realmente veio do Mercado Pago e não foi adulterada.
        // Consulte a documentação do Mercado Pago para a implementação completa da validação da assinatura:
        // [https://www.mercadopago.com.br/developers/pt/guides/notifications/webhooks/security](https://www.mercadopago.com.br/developers/pt/guides/notifications/webhooks/security)

        if (type === 'preapproval') {
            const preapprovalId = data.id;

            // Busca os detalhes da pré-aprovação para obter o external_reference e o status
            const preapprovalDetails = await preApproval.get({ id: preapprovalId });
            const externalReference = preapprovalDetails.external_reference;
            const status = preapprovalDetails.status; // authorized, pending, cancelled, paused

            // Extrai o ID do usuário do external_reference
            const userIdMatch = externalReference.match(/_(plano_mensal|plano_anual)_user_(.+)/);
            const userId = userIdMatch ? userIdMatch[2] : null;

            if (!userId) {
                console.warn("ID do usuário não encontrado no external_reference:", externalReference);
                return res.status(400).send("ID do usuário não encontrado.");
            }

            const user = await User.findById(userId);

            if (!user) {
                console.warn("Usuário não encontrado para o ID:", userId);
                return res.status(404).send("Usuário não encontrado.");
            }

            if (status === 'authorized') { // Assinatura ativa e paga
                user.planoAtivo = true;

                // Define a data de expiração com base no plano
                if (externalReference.includes('plano_mensal')) {
                    user.dataExpiracaoPlano = moment().add(1, 'months').toDate();
                } else if (externalReference.includes('plano_anual')) {
                    user.dataExpiracaoPlano = moment().add(12, 'months').toDate();
                }

                await user.save();
                console.log(`Plano ativado para o usuário ${user.email}. Data de expiração: ${user.dataExpiracaoPlano}`);
            } else if (['cancelled', 'paused', 'pending'].includes(status)) {
                // Lidar com outros status de pré-aprovação, como cancelamento, pausa ou pendente
                user.planoAtivo = false;
                user.dataExpiracaoPlano = null; // Ou defina como a data de cancelamento se aplicável
                await user.save();
                console.log(`Plano do usuário ${user.email} atualizado para ${status}.`);
            }
        } else if (type === 'payment') {
            // Este tipo de notificação é para pagamentos únicos, como o agendamento
            const paymentId = data.id;
            const paymentDetails = await paymentService.get({ id: paymentId });
            const paymentStatus = paymentDetails.status;
            const externalReference = paymentDetails.external_reference; // Deve ser o appointmentId

            console.log(`Webhook de pagamento: ID ${paymentId}, Status: ${paymentStatus}, External Ref: ${externalReference}`);

            if (externalReference && externalReference.length === 24 && paymentStatus === 'approved') { // Verifica se é um ObjectId válido e pagamento aprovado
                const appointment = await Appointment.findById(externalReference);
                if (appointment && appointment.status === 'pending_payment') {
                    appointment.status = 'confirmed';
                    appointment.paymentId = paymentId; // Armazena o ID do pagamento
                    await appointment.save();
                    console.log(`Agendamento ${appointment._id} confirmado via pagamento aprovado.`);
                } else if (appointment && appointment.status === 'confirmed') {
                    console.log(`Agendamento ${appointment._id} já estava confirmado.`);
                } else {
                    console.warn(`Agendamento ${externalReference} não encontrado ou já processado.`);
                }
            } else if (externalReference && externalReference.length === 24 && ['rejected', 'cancelled'].includes(paymentStatus)) {
                // Se o pagamento for rejeitado/cancelado, você pode atualizar o status do agendamento para 'cancelled'
                const appointment = await Appointment.findById(externalReference);
                if (appointment && appointment.status === 'pending_payment') {
                    appointment.status = 'cancelled';
                    await appointment.save();
                    console.log(`Agendamento ${appointment._id} cancelado devido a pagamento ${paymentStatus}.`);
                }
            }
        }

        return res.status(200).send('Webhook recebido com sucesso.');
    } catch (error) {
        console.error("Erro ao processar webhook do Mercado Pago:", error.message || error);
        return res.status(500).send("Erro interno ao processar webhook.");
    }
});

// Função para verificar e desativar planos expirados (pode ser executada por um cron job)
async function verificarPlanosExpirados() {
    try {
        const usersExpirados = await User.find({
            role: 'establishment', // Apenas usuários com role 'establishment' têm planos
            planoAtivo: true,
            dataExpiracaoPlano: { $lte: new Date() } // Encontra usuários com plano ativo e data de expiração passada
        });

        for (const user of usersExpirados) {
            user.planoAtivo = false;
            user.dataExpiracaoPlano = null; // Ou mantenha a data de expiração para histórico
            await user.save();
            console.log(`Plano do usuário ${user.email} desativado por expiração.`);
        }
    } catch (error) {
        console.error("Erro ao verificar planos expirados:", error.message || error);
    }
}

// Exemplo de como você poderia chamar a função de verificação de planos expirados periodicamente
// Em produção, use um serviço de cron job (e.g., Heroku Scheduler, AWS Lambda com CloudWatch Events)
// setInterval(verificarPlanosExpirados, 24 * 60 * 60 * 1000); // Executa a cada 24 horas

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Este é um servidor de API RESTful. O frontend deve ser servido separadamente.');
    console.log('Certifique-se de que o MongoDB esteja rodando.');
    // Chame a função de verificação de planos expirados ao iniciar o servidor
    verificarPlanosExpirados();
});
