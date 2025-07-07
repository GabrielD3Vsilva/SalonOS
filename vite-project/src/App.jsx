import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment'; // Para manipulação de datas

// Estilos CSS puros
const appStyles = `
    /* Reset e Base */
    body {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc; /* Very light gray background */
    }

    /* Layout Principal */
    .main-flex-center {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .app-container {
        max-width: 90%;
        margin: 0 auto;
        background-color: #ffffff;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); /* shadow-xl */
        border-radius: 0.75rem; /* rounded-xl */
        padding: 2rem 3rem; /* p-8 md:p-12 */
        margin-top: 2rem; /* my-8 */
        margin-bottom: 2rem; /* my-8 */
        transition: all 0.3s ease-in-out; /* transform transition-all duration-300 ease-in-out */
    }

    @media (min-width: 768px) {
        .app-container {
            max-width: 768px; /* md */
        }
    }
    @media (min-width: 1024px) {
        .app-container {
            max-width: 1024px; /* lg */
        }
    }

    /* Loading Spinner */
    .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 16rem; /* h-64 */
    }
    .spinner-animation {
        animation: spin 1s linear infinite;
        border-radius: 50%; /* rounded-full */
        height: 4rem; /* h-16 */
        width: 4rem; /* w-16 */
        border-top: 4px solid #8b5cf6; /* border-t-4 border-purple-500 */
        border-bottom: 4px solid #8b5cf6; /* border-b-4 border-purple-500 */
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Mensagens de Notificação */
    .message-box {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        padding: 1rem; /* p-4 */
        border-radius: 0.5rem; /* rounded-lg */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* shadow-md */
        border-left: 4px solid; /* border-l-4 */
        display: block; /* Default to block, hide with JS */
    }
    .message-box.hidden {
        display: none;
    }
    .message-box.info {
        background-color: #e0f2fe; /* bg-blue-100 */
        border-color: #38bdf8; /* border-blue-500 */
        color: #0369a1; /* text-blue-700 */
    }
    .message-box.success {
        background-color: #dcfce7; /* bg-green-100 */
        border-color: #22c55e; /* border-green-500 */
        color: #16a34a; /* text-green-700 */
    }
    .message-box.error {
        background-color: #fee2e2; /* bg-red-100 */
        border-color: #ef4444; /* border-red-500 */
        color: #dc2626; /* text-red-700 */
    }
    .message-text {
        font-weight: 500; /* font-medium */
    }
    .message-close-btn {
        float: right;
        color: inherit; /* text-current */
        font-weight: bold; /* font-bold */
        font-size: 1.125rem; /* text-lg */
        line-height: 1; /* leading-none */
        opacity: 0.75; /* hover:opacity-75 */
        cursor: pointer;
    }
    .message-close-btn:hover {
        opacity: 1;
    }

    /* Estilos para o modal de confirmação */
    .modal {
        display: none; /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 1000; /* Sit on top */
        left: 0;
        top: 0;
        width: 100%; /* Full width */
        height: 100%; /* Full height */
        overflow: auto; /* Enable scroll if needed */
        background-color: rgba(0,0,0,0.6); /* Black w/ opacity */
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px); /* Efeito de desfoque */
    }
    .modal.flex {
        display: flex;
    }
    .modal-content {
        background-color: #ffffff;
        margin: auto;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 450px;
        text-align: center;
        animation: fadeInScale 0.3s ease-out forwards;
    }
    @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    .close-button {
        color: #9ca3af;
        float: right;
        font-size: 32px;
        font-weight: bold;
        line-height: 1;
        margin-top: -10px;
        margin-right: -10px;
        cursor: pointer;
    }
    .close-button:hover,
    .close-button:focus {
        color: #4b5563;
        text-decoration: none;
    }
    .confirm-message {
        font-size: 1.25rem; /* text-xl */
        font-weight: 600; /* font-semibold */
        color: #1f2937; /* text-gray-800 */
        margin-bottom: 1.5rem; /* mb-6 */
    }
    .confirm-buttons {
        display: flex;
        justify-content: center;
        gap: 1rem; /* space-x-4 */
    }
    .confirm-btn {
        font-weight: bold; /* font-bold */
        padding: 0.75rem 1.5rem; /* py-3 px-6 */
        border-radius: 0.5rem; /* rounded-lg */
        outline: none; /* focus:outline-none */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out transform */
        transform: scale(1);
    }
    .confirm-btn:hover {
        transform: scale(1.05); /* hover:scale-105 */
    }
    .confirm-yes-btn {
        background-color: #10b981; /* bg-green-600 */
        color: white;
    }
    .confirm-yes-btn:hover {
        background-color: #059669; /* hover:bg-green-700 */
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5); /* focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 */
    }
    .confirm-no-btn {
        background-color: #ef4444; /* bg-red-600 */
        color: white;
    }
    .confirm-no-btn:hover {
        background-color: #dc2626; /* hover:bg-red-700 */
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5); /* focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 */
    }

    /* Seções Principais */
    .section-spacing {
        margin-top: 2rem;
        margin-bottom: 2rem;
    }

    /* Auth Section */
    .auth-section-title {
        font-size: 2.25rem; /* text-4xl */
        font-weight: 800; /* font-extrabold */
        text-align: center;
        color: #111827; /* text-gray-900 */
        margin-bottom: 2rem; /* mb-8 */
    }
    .auth-toggle-buttons {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem; /* mb-8 */
        background-color: #f3f4f6; /* bg-gray-100 */
        border-radius: 9999px; /* rounded-full */
        padding: 0.25rem; /* p-1 */
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06); /* shadow-inner */
    }
    .auth-toggle-btn {
        flex: 1; /* flex-1 */
        padding: 1rem 2rem; /* px-8 py-4 */
        border-radius: 9999px; /* rounded-full */
        font-weight: 600; /* font-semibold */
        font-size: 1.125rem; /* text-lg */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out */
        outline: none; /* focus:outline-none */
    }
    .auth-toggle-btn.active {
        color: #ffffff; /* text-white */
        background-color: #8b5cf6; /* bg-purple-600 */
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5); /* focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 */
    }
    .auth-toggle-btn.active:hover {
        background-color: #7c3aed; /* hover:bg-purple-700 */
    }
    .auth-toggle-btn.inactive {
        color: #6d28d9; /* text-purple-700 */
        background-color: transparent; /* bg-transparent */
    }
    .auth-toggle-btn.inactive:hover {
        background-color: #ede9fe; /* hover:bg-purple-100 */
    }

    /* Formulários */
    .form-spacing > div {
        margin-bottom: 1.5rem; /* space-y-6 */
    }
    .form-label {
        display: block;
        color: #374151; /* text-gray-700 */
        font-size: 1rem; /* text-base */
        font-weight: 600; /* font-semibold */
        margin-bottom: 0.5rem; /* mb-2 */
    }
    .form-input, .form-select, .form-textarea {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
        appearance: none;
        border: 1px solid #d1d5db; /* border border-gray-300 */
        border-radius: 0.5rem; /* rounded-lg */
        width: 100%; /* w-full */
        padding: 0.75rem 1rem; /* py-3 px-4 */
        color: #1f2937; /* text-gray-800 */
        line-height: 1.5; /* leading-tight */
        outline: none; /* focus:outline-none */
        transition: all 0.2s; /* transition duration-200 */
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5); /* focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 */
        border-color: #8b5cf6; /* focus:border-purple-500 */
    }
    .form-textarea {
        resize: vertical;
    }

    /* Botões de Ação Geral */
    .btn-action {
        font-weight: bold; /* font-bold */
        padding: 0.75rem 1.5rem; /* py-3 px-6 */
        border-radius: 0.5rem; /* rounded-lg */
        width: 100%; /* w-full */
        outline: none; /* focus:outline-none */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* shadow-md */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out transform */
        transform: scale(1);
        font-size: 1.125rem; /* text-lg */
        cursor: pointer;
    }
    .btn-action:hover {
        transform: scale(1.05); /* hover:scale-105 */
    }
    .btn-purple {
        background-color: #8b5cf6; /* bg-purple-600 */
        color: white;
    }
    .btn-purple:hover {
        background-color: #7c3aed; /* hover:bg-purple-700 */
    }
    .btn-green {
        background-color: #10b981; /* bg-green-600 */
        color: white;
    }
    .btn-green:hover {
        background-color: #059669; /* hover:bg-green-700 */
    }
    .btn-red {
        background-color: #ef4444; /* bg-red-500 */
        color: white;
    }
    .btn-red:hover {
        background-color: #dc2626; /* hover:bg-red-600 */
    }
    .btn-blue {
        background-color: #2563eb; /* bg-blue-600 */
        color: white;
    }
    .btn-blue:hover {
        background-color: #1d4ed8; /* hover:bg-blue-700 */
    }
    .btn-yellow {
        background-color: #f59e0b; /* bg-yellow-500 */
        color: white;
    }
    .btn-yellow:hover {
        background-color: #d97706; /* hover:bg-yellow-600 */
    }
    .btn-small {
        padding: 0.5rem 0.75rem; /* py-2 px-3 */
        font-size: 0.875rem; /* text-sm */
    }
    .btn-medium {
        padding: 0.75rem 1.5rem; /* py-3 px-6 */
        font-size: 1.125rem; /* text-lg */
    }
    .btn-large {
        padding: 1rem 2rem; /* py-4 px-8 */
        font-size: 1.25rem; /* text-xl */
    }

    /* Seção de Planos */
    .plans-section-title {
        font-size: 2.25rem; /* text-4xl */
        font-weight: 800; /* font-extrabold */
        color: #111827; /* text-gray-900 */
        margin-bottom: 1.5rem; /* mb-6 */
    }
    .plans-description {
        font-size: 1.125rem; /* text-lg */
        color: #374151; /* text-gray-700 */
        margin-bottom: 2.5rem; /* mb-10 */
    }
    .plan-cards-container {
        display: flex;
        flex-direction: column; /* flex-col */
        justify-content: center;
        align-items: stretch; /* items-stretch */
        gap: 2rem; /* gap-8 */
    }
    @media (min-width: 768px) {
        .plan-cards-container {
            flex-direction: row; /* md:flex-row */
        }
    }
    .plan-card {
        background-color: #ffffff; /* bg-white */
        border: 1px solid #e9d5ff; /* border border-purple-200 */
        border-radius: 0.75rem; /* rounded-xl */
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); /* shadow-lg */
        padding: 2rem; /* p-8 */
        width: 100%; /* w-full */
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: none; /* transform */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out */
    }
    .plan-card:hover {
        transform: scale(1.05); /* hover:scale-105 */
    }
    @media (min-width: 768px) {
        .plan-card {
            width: calc(50% - 1rem); /* md:w-1/2 */
        }
    }
    @media (min-width: 1024px) {
        .plan-card {
            width: calc(33.333% - 1.333rem); /* lg:w-1/3 */
        }
    }
    .plan-title {
        font-size: 1.875rem; /* text-3xl */
        font-weight: bold; /* font-bold */
        color: #6d28d9; /* text-purple-700 */
        margin-bottom: 1.25rem; /* mb-5 */
    }
    .plan-price {
        font-size: 3rem; /* text-5xl */
        font-weight: 800; /* font-extrabold */
        color: #111827; /* text-gray-900 */
        margin-bottom: 1.5rem; /* mb-6 */
    }
    .plan-price span {
        font-size: 1.25rem; /* text-xl */
        font-weight: 500; /* font-medium */
        color: #4b5563; /* text-gray-600 */
    }
    .plan-features {
        text-align: left;
        color: #374151; /* text-gray-700 */
        margin-bottom: 2rem; /* mb-8 */
        font-size: 1.125rem; /* text-lg */
    }
    .plan-features li {
        margin-bottom: 0.75rem; /* space-y-3 */
    }
    .plan-features li i {
        color: #22c55e; /* text-green-500 */
        margin-right: 0.5rem; /* mr-2 */
    }
    .logout-plans-btn {
        margin-top: 2.5rem; /* mt-10 */
        background-color: #ef4444; /* bg-red-500 */
        color: white;
        font-weight: bold;
        padding: 0.75rem 1.5rem; /* py-3 px-6 */
        border-radius: 0.5rem; /* rounded-lg */
        outline: none; /* focus:outline-none focus:shadow-outline */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out transform */
        transform: scale(1);
        font-size: 1.125rem; /* text-lg */
        cursor: pointer;
    }
    .logout-plans-btn:hover {
        background-color: #dc2626; /* hover:bg-red-600 */
        transform: scale(1.05); /* hover:scale-105 */
    }

    /* Dashboard Section */
    .dashboard-title {
        font-size: 2.25rem; /* text-4xl */
        font-weight: 800; /* font-extrabold */
        text-align: center;
        color: #111827; /* text-gray-900 */
        margin-bottom: 2rem; /* mb-8 */
    }
    .welcome-text {
        text-align: center;
        color: #374151; /* text-gray-700 */
        margin-bottom: 1rem; /* mb-4 */
        font-size: 1.125rem; /* text-lg */
    }
    .welcome-text span {
        font-weight: bold; /* font-bold */
        color: #6d28d9; /* text-purple-700 */
    }
    .role-text {
        text-align: center;
        color: #374151; /* text-gray-700 */
        margin-bottom: 1.5rem; /* mb-6 */
        font-size: 1rem; /* text-base */
    }
    .role-text span {
        font-weight: bold; /* font-bold */
        text-transform: capitalize; /* capitalize */
        color: #6d28d9; /* text-purple-700 */
    }
    .dashboard-logout-btn {
        background-color: #ef4444; /* bg-red-500 */
        color: white;
        font-weight: bold;
        padding: 0.5rem 1rem; /* py-2 px-4 */
        border-radius: 0.5rem; /* rounded-lg */
        float: right;
        margin-bottom: 1.5rem; /* mb-6 */
        outline: none; /* focus:outline-none focus:shadow-outline */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out transform */
        transform: scale(1);
        cursor: pointer;
    }
    .dashboard-logout-btn:hover {
        background-color: #dc2626; /* hover:bg-red-600 */
        transform: scale(1.05); /* hover:scale-105 */
    }
    .dashboard-nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem; /* gap-4 */
        margin-bottom: 2.5rem; /* mb-10 */
        clear: both;
    }
    .dashboard-nav-btn {
        padding: 0.75rem 1.5rem; /* py-3 px-6 */
        border-radius: 0.5rem; /* rounded-lg */
        font-weight: 600; /* font-semibold */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* shadow-md */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out transform */
        transform: scale(1);
        color: white;
        background-color: #8b5cf6; /* bg-purple-500 */
        cursor: pointer;
    }
    .dashboard-nav-btn:hover {
        background-color: #7c3aed; /* hover:bg-purple-600 */
        transform: scale(1.05); /* hover:scale-105 */
    }
    .dashboard-nav-btn.active {
        background-color: #7c3aed; /* bg-purple-600 */
    }
    .dashboard-content-section {
        background-color: #f9fafb; /* bg-gray-50 */
        padding: 2rem; /* p-8 */
        border-radius: 0.75rem; /* rounded-xl */
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06); /* shadow-inner */
    }

    /* Perfil do Estabelecimento */
    .profile-section-title, .employees-section-title, .availability-section-title, .services-section-title, .appointments-section-title {
        font-size: 1.875rem; /* text-3xl */
        font-weight: bold; /* font-bold */
        color: #1f2937; /* text-gray-800 */
        margin-bottom: 1.5rem; /* mb-6 */
        border-bottom: 1px solid #e5e7eb; /* border-b pb-4 border-gray-200 */
        padding-bottom: 1rem; /* pb-4 */
    }
    .public-link-display {
        background-color: #ede9fe; /* bg-purple-50 */
        padding: 1rem; /* p-4 */
        border-radius: 0.5rem; /* rounded-lg */
        border: 1px solid #d8b4fe; /* border border-purple-200 */
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem; /* gap-3 */
    }
    .public-link-text {
        color: #6d28d9; /* text-purple-800 */
        font-size: 1rem; /* text-base */
        font-weight: 600; /* font-semibold */
    }
    .public-link-value {
        color: #2563eb; /* text-blue-600 */
        text-decoration: none; /* hover:underline */
        word-break: break-all; /* break-all */
        font-size: 0.875rem; /* text-sm md:text-base */
        flex: 1; /* flex-1 */
    }
    .public-link-value:hover {
        text-decoration: underline;
    }

    /* Listas e Cards (Funcionários, Serviços, Agendamentos) */
    .card-list-container > p {
        color: #6b7280; /* text-gray-500 */
        text-align: center;
        padding: 1rem; /* py-4 */
    }
    .add-form-card {
        background-color: #ffffff; /* bg-white */
        padding: 1.5rem; /* p-6 */
        border-radius: 0.5rem; /* rounded-lg */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* shadow-md */
        margin-bottom: 2rem; /* mb-8 */
    }
    .add-form-title {
        font-size: 1.5rem; /* text-2xl */
        font-weight: 600; /* font-semibold */
        color: #374151; /* text-gray-700 */
        border-bottom: 1px solid #f3f4f6; /* border-b pb-3 mb-4 border-gray-100 */
        padding-bottom: 0.75rem; /* pb-3 */
        margin-bottom: 1rem; /* mb-4 */
    }
    .item-card {
        background-color: #ffffff; /* bg-white */
        padding: 1.25rem; /* p-5 */
        border-radius: 0.5rem; /* rounded-lg */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); /* shadow-md */
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid #f3f4f6; /* border border-gray-100 */
    }
    .item-name {
        font-weight: 600; /* font-semibold */
        color: #1f2937; /* text-gray-800 */
        font-size: 1.125rem; /* text-lg */
    }
    .item-details {
        font-size: 0.875rem; /* text-sm */
        color: #4b5563; /* text-gray-600 */
    }
    .item-actions {
        display: flex;
        gap: 0.5rem; /* mr-2 */
    }

    /* Disponibilidade */
    .day-availability-item {
        display: flex;
        align-items: center;
        gap: 0.75rem; /* space-x-3 */
        background-color: #f3f4f6; /* bg-gray-100 */
        padding: 0.75rem; /* p-3 */
        border-radius: 0.375rem; /* rounded-md */
    }
    .day-checkbox {
        height: 1.25rem; /* h-5 */
        width: 1.25rem; /* w-5 */
        color: #8b5cf6; /* text-purple-600 */
        outline: none; /* focus:ring-purple-500 */
        border-radius: 0.25rem; /* rounded */
        cursor: pointer;
    }
    .day-label {
        color: #374151; /* text-gray-700 */
        font-weight: 500; /* font-medium */
        flex: 1; /* flex-1 */
    }
    .time-input {
        border: 1px solid #d1d5db; /* border rounded-md p-2 */
        border-radius: 0.375rem;
        padding: 0.5rem;
        color: #374151; /* text-gray-700 */
    }
    .time-input:disabled {
        background-color: #e5e7eb; /* disabled:bg-gray-200 */
        color: #6b7280; /* disabled:text-gray-500 */
    }
    .time-separator {
        color: #4b5563; /* text-gray-600 */
    }

    /* Agendamentos */
    .appointment-status-container {
        display: flex;
        align-items: center;
        gap: 0.75rem; /* space-x-3 */
    }
    .appointment-status-text {
        font-size: 1rem; /* text-base */
        font-weight: 500; /* font-medium */
        text-transform: capitalize; /* capitalize */
    }
    .status-pending { color: #d97706; } /* text-yellow-600 */
    .status-confirmed { color: #16a34a; } /* text-green-600 */
    .status-completed { color: #2563eb; } /* text-blue-600 */
    .status-cancelled { color: #dc2626; } /* text-red-600 */
    .status-select {
        background-color: white; /* bg-white */
        border: 1px solid #d1d5db; /* border border-gray-300 */
        border-radius: 0.375rem; /* rounded-md */
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
        padding: 0.5rem 0.75rem; /* py-2 px-3 */
        font-size: 0.875rem; /* text-sm */
        outline: none; /* focus:outline-none */
        transition: all 0.2s; /* transition duration-200 */
    }
    .status-select:focus {
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5); /* focus:ring-purple-500 focus:border-purple-500 */
        border-color: #8b5cf6;
    }

    /* Página Pública de Agendamento */
    .public-section-title {
        font-size: 2.25rem; /* text-4xl */
        font-weight: 800; /* font-extrabold */
        text-align: center;
        color: #111827; /* text-gray-900 */
        margin-bottom: 1rem; /* mb-4 */
    }
    .public-section-description {
        text-align: center;
        color: #374151; /* text-gray-700 */
        margin-bottom: 2rem; /* mb-8 */
        font-size: 1.125rem; /* text-lg */
    }
    .public-form-group > label {
        margin-bottom: 0.5rem;
    }
    .public-services-select {
        height: 10rem; /* h-40 */
    }
    .public-select-info {
        font-size: 0.875rem; /* text-sm */
        color: #6b7280; /* text-gray-500 */
        margin-top: 0.5rem; /* mt-2 */
    }
    .public-calendar-wrapper {
        background-color: #f9fafb; /* bg-gray-50 */
        padding: 1.5rem; /* p-6 */
        border-radius: 0.5rem; /* rounded-lg */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* shadow-md */
    }

    /* Estilos para o calendário */
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
    }
    .calendar-day {
        padding: 10px 5px;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        font-weight: 500;
    }
    .calendar-day.current-month {
        background-color: #f1f5f9; /* Light blue-gray for current month days */
        color: #334155;
    }
    .calendar-day.other-month {
        background-color: #e2e8f0;
        color: #94a3b8;
        opacity: 0.7;
    }
    .calendar-day.selected {
        background-color: #8b5cf6; /* Purple */
        color: white;
        box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
        transform: translateY(-2px);
    }
    .calendar-day.selected:hover {
        background-color: #7c3aed;
    }
    .calendar-day:not(.selected):hover {
        background-color: #e0e7ff; /* Lighter purple on hover */
        color: #6d28d9;
    }
    .calendar-day.today {
        border: 2px solid #8b5cf6;
        background-color: #ede9fe;
    }
    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 10px 0;
        border-bottom: 1px solid #e2e8f0;
    }
    .calendar-header button {
        padding: 8px 12px;
        background-color: #8b5cf6;
        color: white;
        border-radius: 8px;
        transition: background-color 0.2s;
        cursor: pointer;
    }
    .calendar-header button:hover {
        background-color: #7c3aed;
    }
    .day-name {
        font-weight: 600;
        color: #64748b;
        text-align: center;
        padding-bottom: 10px;
    }
    .time-slot {
        padding: 10px 15px;
        background-color: #f1f5f9;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        text-align: center;
        font-weight: 500;
        color: #334155;
        flex-grow: 1; /* Make time slots fill available space */
    }
    .time-slot:hover {
        background-color: #e0e7ff;
        color: #6d28d9;
    }
    .time-slot.selected-time {
        background-color: #8b5cf6;
        color: white;
        box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
        transform: translateY(-2px);
    }
    .time-slot.selected-time:hover {
        background-color: #7c3aed;
    }
    .time-slots-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
        max-height: 300px; /* Limit height for scrollability */
        overflow-y: auto; /* Enable vertical scrolling */
        padding-right: 5px; /* Prevent scrollbar from overlapping content */
    }
    /* Custom scrollbar for time slots */
    .time-slots-container::-webkit-scrollbar {
        width: 8px;
    }
    .time-slots-container::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
    }
    .time-slots-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
    }
    .time-slots-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }

    /* Página de Status de Pagamento */
    .payment-status-page {
        text-align: center;
    }
    .payment-status-title {
        font-size: 2.25rem; /* text-4xl */
        font-weight: 800; /* font-extrabold */
        color: #111827; /* text-gray-900 */
        margin-bottom: 1rem; /* mb-4 */
    }
    .payment-status-message {
        font-size: 1.25rem; /* text-xl */
        color: #374151; /* text-gray-700 */
        margin-bottom: 2rem; /* mb-8 */
    }
    .countdown-text {
        color: #4b5563; /* text-gray-600 */
        font-size: 1.125rem; /* text-lg */
    }
    .countdown-value {
        font-weight: bold; /* font-bold */
        color: #8b5cf6; /* text-purple-600 */
    }
    .btn-go-home {
        margin-top: 2rem; /* mt-8 */
        background-color: #8b5cf6; /* bg-purple-600 */
        color: white;
        font-weight: bold;
        padding: 0.75rem 1.5rem; /* py-3 px-6 */
        border-radius: 0.5rem; /* rounded-lg */
        outline: none; /* focus:outline-none focus:shadow-outline */
        transition: all 0.3s ease-in-out; /* transition duration-300 ease-in-out transform */
        transform: scale(1);
        font-size: 1.125rem; /* text-lg */
        cursor: pointer;
    }
    .btn-go-home:hover {
        background-color: #7c3aed; /* hover:bg-purple-700 */
        transform: scale(1.05); /* hover:scale-105 */
    }
`;

const API_BASE_URL = 'http://localhost:3000/api'; // Certifique-se que esta URL corresponde ao seu backend

// Componente principal da aplicação
const App = () => {
    // Estados da aplicação
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessageText, setConfirmMessageText] = useState('');
    const [confirmResolve, setConfirmResolve] = useState(null);

    const [currentUser, setCurrentUser] = useState(undefined); // Initialize as undefined to differentiate from null (no user)
    const [currentEstablishmentId, setCurrentEstablishmentId] = useState(null);
    const [currentEstablishmentPublicLink, setCurrentEstablishmentPublicLink] = useState(null);
    const [publicBookingEstablishmentId, setPublicBookingEstablishmentId] = useState(null);

    const [showAuthSection, setShowAuthSection] = useState(true);
    const [showLoginForm, setShowLoginForm] = useState(true);
    const [showPlansSection, setShowPlansSection] = useState(false);
    const [showDashboardSection, setShowDashboardSection] = useState(false);
    const [showPublicBookingSection, setShowPublicBookingSection] = useState(false);
    const [showPaymentStatusPage, setShowPaymentStatusPage] = useState(false);

    const [dashboardActiveContent, setDashboardActiveContent] = useState('profile-section');

    // Estados para formulários
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerRole, setRegisterRole] = useState('establishment');
    const [registerEstablishmentId, setRegisterEstablishmentId] = useState('');

    const [establishmentName, setEstablishmentName] = useState('');
    const [establishmentAddress, setEstablishmentAddress] = useState('');
    const [establishmentPhone, setEstablishmentPhone] = useState('');
    const [establishmentDescription, setEstablishmentDescription] = useState('');

    const [employeeName, setEmployeeName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeePhone, setEmployeePhone] = useState('');
    const [employees, setEmployees] = useState([]);

    const [availabilityEmployeeSelect, setAvailabilityEmployeeSelect] = useState('');
    const [employeeAvailabilityData, setEmployeeAvailabilityData] = useState({}); // {dayOfWeek: {start, end}}
    const [employeesForAvailability, setEmployeesForAvailability] = useState([]);

    const [serviceName, setServiceName] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceDuration, setServiceDuration] = useState('');
    const [services, setServices] = useState([]);

    const [appointments, setAppointments] = useState([]);

    const [publicClientName, setPublicClientName] = useState('');
    const [publicClientPhone, setPublicClientPhone] = useState('');
    const [publicSelectedServices, setPublicSelectedServices] = useState([]);
    const [publicSelectedEmployee, setPublicSelectedEmployee] = useState('');
    const [publicAvailableTimes, setPublicAvailableTimes] = useState([]);
    const [publicSelectedTime, setPublicSelectedTime] = useState('');
    const [publicCurrentCalendarDate, setPublicCurrentCalendarDate] = useState(new Date());
    const [publicSelectedDate, setPublicSelectedDate] = useState('');
    const [publicEstablishmentDetails, setPublicEstablishmentDetails] = useState(null);

    const [paymentStatusTitle, setPaymentStatusTitle] = useState('');
    const [paymentStatusMessageText, setPaymentStatusMessageText] = useState('');
    const [countdown, setCountdown] = useState(5);

    // Funções de UI
    const showMessageBox = useCallback((text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000); // Esconde após 5 segundos
    }, []);

    const showCustomConfirm = useCallback((msg) => {
        setConfirmMessageText(msg);
        setShowConfirmModal(true);
        return new Promise((resolve) => {
            setConfirmResolve(() => resolve);
        });
    }, []);

    const handleConfirmResponse = (response) => {
        setShowConfirmModal(false);
        if (confirmResolve) {
            confirmResolve(response);
            setConfirmResolve(null);
        }
    };

    const showSection = useCallback((sectionName) => {
        setShowAuthSection(false);
        setShowDashboardSection(false);
        setShowPublicBookingSection(false);
        setShowPlansSection(false);
        setShowPaymentStatusPage(false);

        switch (sectionName) {
            case 'auth-section':
                setShowAuthSection(true);
                break;
            case 'dashboard-section':
                setShowDashboardSection(true);
                break;
            case 'public-booking-section':
                setShowPublicBookingSection(true);
                break;
            case 'plans-section':
                setShowPlansSection(true);
                break;
            case 'payment-status-page':
                setShowPaymentStatusPage(true);
                break;
            default:
                break;
        }
    }, []);

    const showDashboardContent = useCallback((contentName) => {
        setDashboardActiveContent(contentName);
    }, []);

    const clearForms = useCallback(() => {
        setLoginEmail('');
        setLoginPassword('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterRole('establishment');
        setRegisterEstablishmentId('');
        setEstablishmentName('');
        setEstablishmentAddress('');
        setEstablishmentPhone('');
        setEstablishmentDescription('');
        setEmployeeName('');
        setEmployeeEmail('');
        setEmployeePhone('');
        setServiceName('');
        setServicePrice('');
        setServiceDuration('');
        setPublicClientName('');
        setPublicClientPhone('');
        setPublicSelectedServices([]);
        setPublicSelectedEmployee('');
        setPublicSelectedDate('');
        setPublicSelectedTime('');
        setEmployeeAvailabilityData({});
    }, []);

    // Funções de Autenticação e Estado
    const saveAuthData = useCallback((token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userRole', role);
        if (establishmentId) {
            localStorage.setItem('establishmentId', establishmentId);
        } else {
            localStorage.removeItem('establishmentId');
        }
        localStorage.setItem('userEmail', email);
        // Salva as informações do plano no localStorage para o usuário
        localStorage.setItem('userPlanoAtivo', planoAtivo);
        localStorage.setItem('userDataExpiracaoPlano', dataExpiracaoPlano);

        setCurrentUser({ token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano });
        setCurrentEstablishmentId(establishmentId);
    }, []);

    const loadAuthData = useCallback(() => {
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('userRole');
        const establishmentId = localStorage.getItem('establishmentId');
        const email = localStorage.getItem('userEmail');
        const planoAtivo = localStorage.getItem('userPlanoAtivo') === 'true'; // Converte para booleano
        const dataExpiracaoPlano = localStorage.getItem('userDataExpiracaoPlano');

        if (token && role) {
            setCurrentUser({ token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano });
            setCurrentEstablishmentId(establishmentId);
            return true;
        }
        setCurrentUser(null); // Explicitly set to null if no data found
        setCurrentEstablishmentId(null);
        return false;
    }, []);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('establishmentId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPlanoAtivo'); // Limpa também o plano
        localStorage.removeItem('userDataExpiracaoPlano'); // Limpa também a data de expiração
        setCurrentUser(null);
        setCurrentEstablishmentId(null);
        setCurrentEstablishmentPublicLink(null);
    }, []);

    // Funções de fetch para o Dashboard (MOVIDAS PARA CIMA)
    const fetchEstablishmentProfile = useCallback(async () => {
        // Esta função agora é chamada apenas se o usuário tiver um plano ativo E um establishmentId
        if (!currentUser || !currentUser.establishmentId) {
            // Isso não deve acontecer se a lógica de redirecionamento estiver correta,
            // mas é um fallback seguro.
            showMessageBox('Não foi possível carregar o perfil do estabelecimento. Verifique seu login e plano.', 'error');
            setEstablishmentName('');
            setEstablishmentAddress('');
            setEstablishmentPhone('');
            setEstablishmentDescription('');
            setCurrentEstablishmentPublicLink(null);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/establishments/${currentUser.establishmentId}`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setEstablishmentName(data.name);
                setEstablishmentAddress(data.address);
                setEstablishmentPhone(data.phone);
                setEstablishmentDescription(data.description || '');
                setCurrentEstablishmentPublicLink(`${window.location.origin}/public${data.publicLink}`);
            } else {
                showMessageBox(data.message || 'Erro ao carregar perfil do estabelecimento.', 'error');
                // Se o estabelecimento não for encontrado, pode ser um caso de usuário novo que precisa criar
                if (response.status === 404 && currentUser.role === 'establishment') {
                    showMessageBox('Crie o perfil do seu estabelecimento.', 'info');
                }
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar perfil.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, showMessageBox]);

    const fetchEmployees = useCallback(async () => {
        if (!currentEstablishmentId) {
            setEmployees([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${currentEstablishmentId}`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setEmployees(data);
            } else {
                showMessageBox(data.message || 'Erro ao carregar funcionários.', 'error');
                setEmployees([]);
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar funcionários.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, currentEstablishmentId, showMessageBox]);

    const fetchEmployeesForAvailability = useCallback(async () => {
        if (!currentEstablishmentId) {
            setEmployeesForAvailability([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${currentEstablishmentId}`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setEmployeesForAvailability(data);
            } else {
                showMessageBox(data.message || 'Erro ao carregar funcionários para disponibilidade.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar funcionários para disponibilidade.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, currentEstablishmentId, showMessageBox]);

    const loadEmployeeAvailability = useCallback(async (employeeId = availabilityEmployeeSelect) => {
        if (!employeeId) {
            setEmployeeAvailabilityData({});
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/availability/${employeeId}`);
            const data = await response.json();

            const newAvailabilityData = {};
            if (response.ok && data.days) {
                data.days.forEach(day => {
                    if (day.intervals && day.intervals.length > 0) {
                        newAvailabilityData[day.dayOfWeek] = {
                            start: day.intervals[0].start,
                            end: day.intervals[0].end
                        };
                    }
                });
            } else if (response.status === 404) {
                showMessageBox('Nenhuma disponibilidade configurada para este funcionário.', 'info');
            } else {
                showMessageBox(data.message || 'Erro ao carregar disponibilidade.', 'error');
            }
            setEmployeeAvailabilityData(newAvailabilityData);
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar disponibilidade.', 'error');
        } finally {
            setLoading(false);
        }
    }, [availabilityEmployeeSelect, showMessageBox]);

    const fetchServices = useCallback(async () => {
        if (!currentEstablishmentId) {
            setServices([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/services/${currentEstablishmentId}`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setServices(data);
            } else {
                showMessageBox(data.message || 'Erro ao carregar serviços.', 'error');
                setServices([]);
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar serviços.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, currentEstablishmentId, showMessageBox]);

    const fetchAppointments = useCallback(async () => {
        if (!currentEstablishmentId) {
            setAppointments([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${currentEstablishmentId}`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setAppointments(data.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
            } else {
                showMessageBox(data.message || 'Erro ao carregar agendamentos.', 'error');
                setAppointments([]);
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar agendamentos.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, currentEstablishmentId, showMessageBox]);

    // Funções da Página Pública de Agendamento (MOVIDAS PARA CIMA)
    const loadPublicBookingPage = useCallback(async (establishmentId) => {
        setLoading(true);
        showSection('public-booking-section');
        try {
            const response = await fetch(`${API_BASE_URL}/public/establishment/${establishmentId}`);
            const data = await response.json();

            if (response.ok) {
                setPublicEstablishmentDetails(data.establishment);
                setServices(data.services); // Reutiliza o estado de serviços
                setEmployees(data.employees); // Reutiliza o estado de funcionários
                setPublicCurrentCalendarDate(new Date()); // Reseta o calendário
            } else {
                showMessageBox(data.message || 'Estabelecimento não encontrado ou erro ao carregar.', 'error');
                setPublicEstablishmentDetails(null);
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para carregar a página de agendamento.', 'error');
            setPublicEstablishmentDetails(null);
        } finally {
            setLoading(false);
        }
    }, [showMessageBox, showSection]);

    // Função para lidar com o redirecionamento baseado no status do plano do usuário
    const handleUserPlanRedirection = useCallback(async (user) => {
        setLoading(true);
        if (!user) { // No user logged in
            showSection('auth-section');
            setLoading(false);
            return;
        }

        if (user.role === 'establishment') {
            if (!user.planoAtivo) {
                showSection('plans-section');
                showMessageBox('Seu plano não está ativo. Por favor, assine um plano para continuar.', 'info');
            } else if (!user.establishmentId) {
                showSection('dashboard-section');
                setDashboardActiveContent('profile-section');
                showMessageBox('Crie o perfil do seu estabelecimento para continuar.', 'info');
            } else {
                showSection('dashboard-section');
                await fetchEstablishmentProfile(); // Carrega o perfil do estabelecimento se o plano estiver ativo
                showDashboardContent('profile-section');
            }
        } else if (user.role === 'employee') {
            // Para funcionários, sempre vai para a seção de perfil do dashboard
            showSection('dashboard-section');
            setDashboardActiveContent('profile-section');
            // Opcionalmente, buscar dados específicos do funcionário ou mostrar uma mensagem, se necessário
        }
        setLoading(false);
    }, [showSection, showDashboardContent, showMessageBox, fetchEstablishmentProfile]);

    const renderCalendarDays = useCallback(() => {
        const days = [];
        const year = publicCurrentCalendarDate.getFullYear();
        const month = publicCurrentCalendarDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const firstDayOfWeek = firstDayOfMonth.getDay();

        // Dias do mês anterior
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevMonthDay = new Date(year, month, 0).getDate() - (firstDayOfWeek - 1 - i);
            days.push(<div key={`prev-${i}`} className="calendar-day other-month">{prevMonthDay}</div>);
        }

        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = dateStr === publicSelectedDate;

            days.push(
                <div
                    key={`current-${day}`}
                    className={`calendar-day current-month ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                        setPublicSelectedDate(dateStr);
                        setPublicSelectedTime('');
                    }}
                >
                    {day}
                </div>
            );
        }

        // Dias do próximo mês
        const totalDaysDisplayed = firstDayOfWeek + daysInMonth;
        const remainingDays = 42 - totalDaysDisplayed;
        for (let i = 1; i <= remainingDays; i++) {
            days.push(<div key={`next-${i}`} className="calendar-day other-month">{i}</div>);
        }
        return days;
    }, [publicCurrentCalendarDate, publicSelectedDate]);

    const changeMonth = (offset) => {
        const newDate = new Date(publicCurrentCalendarDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setPublicCurrentCalendarDate(newDate);
        setPublicSelectedDate('');
        setPublicSelectedTime('');
        setPublicAvailableTimes([]);
    };

    const fetchAvailableTimes = useCallback(async () => {
        const employeeId = publicSelectedEmployee;
        const date = publicSelectedDate;

        if (!employeeId || !date) {
            setPublicAvailableTimes([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/public/available-times/${employeeId}/${date}`);
            const data = await response.json();

            if (response.ok && data.availableTimes && data.availableTimes.length > 0) {
                setPublicAvailableTimes(data.availableTimes);
            } else {
                setPublicAvailableTimes([]);
                showMessageBox(data.message || 'Nenhum horário disponível para esta data e funcionário.', 'info');
            }
        } catch (error) {
            console.error('Erro ao buscar horários disponíveis:', error);
            showMessageBox('Erro ao buscar horários disponíveis.', 'error');
        } finally {
            setLoading(false);
        }
    }, [publicSelectedEmployee, publicSelectedDate, showMessageBox]);

    // Efeito para buscar horários disponíveis quando a data ou funcionário mudam
    useEffect(() => {
        fetchAvailableTimes();
    }, [publicSelectedDate, publicSelectedEmployee, fetchAvailableTimes]);

    const handlePaymentStatusPage = useCallback((path, appointmentId) => {
        showSection('payment-status-page');
        let title = '';
        let message = '';
        let type = 'info';

        if (path.startsWith('/payment-success')) {
            title = 'Pagamento Aprovado!';
            message = 'Seu agendamento foi confirmado com sucesso!';
            type = 'success';
        } else if (path.startsWith('/payment-failure')) {
            title = 'Pagamento Recusado!';
            message = 'Houve um problema com seu pagamento. Seu agendamento não foi confirmado.';
            type = 'error';
        } else if (path.startsWith('/payment-pending')) {
            title = 'Pagamento Pendente!';
            message = 'Seu pagamento está em análise. Você receberá uma confirmação em breve.';
            type = 'info';
        }

        setPaymentStatusTitle(title);
        setPaymentStatusMessageText(message);
        showMessageBox(message, type);

        let currentCountdown = 5;
        setCountdown(currentCountdown);
        const interval = setInterval(() => {
            currentCountdown--;
            setCountdown(currentCountdown);
            if (currentCountdown <= 0) {
                clearInterval(interval);
                window.location.href = '/';
            }
        }, 1000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, [showMessageBox, showSection]);

    // Handlers de formulário e ações
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword })
            });
            const data = await response.json();

            if (response.ok) {
                // Modificado: Agora salva planoAtivo e dataExpiracaoPlano do response de login
                saveAuthData(data.token, data.role, data.establishmentId, loginEmail, data.planoAtivo, data.dataExpiracaoPlano);
                showMessageBox('Login bem-sucedido!', 'success');
                // handleUserPlanRedirection will be called by the useEffect watching currentUser
            } else {
                showMessageBox(data.message || 'Erro no login.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { email: registerEmail, password: registerPassword, role: registerRole };
            if (registerRole === 'employee' && registerEstablishmentId) {
                payload.establishmentId = registerEstablishmentId;
            }

            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox('Registro realizado com sucesso! Agora você pode fazer login.', 'success');
                clearForms();
                setShowLoginForm(true); // Volta para a tela de login
            } else {
                showMessageBox(data.message || 'Erro no registro.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuthData();
        showMessageBox('Você foi desconectado.', 'info');
        showSection('auth-section');
        clearForms();
    };

    const handleEstablishmentProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = currentEstablishmentId ? 'PUT' : 'POST';
            const url = currentEstablishmentId ? `${API_BASE_URL}/establishments/${currentEstablishmentId}` : `${API_BASE_URL}/establishments`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({
                    name: establishmentName,
                    address: establishmentAddress,
                    phone: establishmentPhone,
                    description: establishmentDescription
                })
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
                if (!currentEstablishmentId && data.establishment) {
                    setCurrentEstablishmentId(data.establishment._id);
                    localStorage.setItem('establishmentId', data.establishment._id);
                    setCurrentUser(prev => ({ ...prev, establishmentId: data.establishment._id }));
                }
                setCurrentEstablishmentPublicLink(`${window.location.origin}/public${data.establishment.publicLink}`);
                // Após salvar o perfil do estabelecimento, reavalia o redirecionamento do plano
                // (útil se o usuário criou o perfil e agora precisa verificar o plano)
                handleUserPlanRedirection(currentUser); // Reavalia o redirecionamento com o currentUser atualizado
            } else {
                showMessageBox(data.message || 'Erro ao salvar perfil.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para salvar perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyPublicLink = () => {
        if (currentEstablishmentPublicLink) {
            navigator.clipboard.writeText(currentEstablishmentPublicLink)
                .then(() => showMessageBox('Link copiado para a área de transferência!', 'success'))
                .catch(err => {
                    console.error('Erro ao copiar:', err);
                    // Fallback para navegadores mais antigos
                    const textArea = document.createElement("textarea");
                    textArea.value = currentEstablishmentPublicLink;
                    textArea.style.position = "fixed";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        showMessageBox('Link copiado para a área de transferência! (Método fallback)', 'success');
                    } catch (errFallback) {
                        showMessageBox('Falha ao copiar o link.', 'error');
                    }
                    document.body.removeChild(textArea);
                });
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ name: employeeName, email: employeeEmail, phone: employeePhone })
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
                setEmployeeName('');
                setEmployeeEmail('');
                setEmployeePhone('');
                await fetchEmployees();
                await fetchEmployeesForAvailability(); // Atualiza a lista de funcionários para disponibilidade
            } else {
                showMessageBox(data.message || 'Erro ao adicionar funcionário.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para adicionar funcionário.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        const confirmed = await showCustomConfirm('Tem certeza que deseja deletar este funcionário?');
        if (!confirmed) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
                await fetchEmployees();
                await fetchEmployeesForAvailability(); // Atualiza a lista de funcionários para disponibilidade
            } else {
                showMessageBox(data.message || 'Erro ao deletar funcionário.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para deletar funcionário.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvailabilityChange = (dayOfWeek, field, value) => {
        setEmployeeAvailabilityData(prev => ({
            ...prev,
            [dayOfWeek]: {
                ...prev[dayOfWeek],
                [field]: value
            }
        }));
    };

    const handleDayCheckboxChange = (dayOfWeek, checked) => {
        if (checked) {
            setEmployeeAvailabilityData(prev => ({
                ...prev,
                [dayOfWeek]: { start: '', end: '' } // Inicializa com valores vazios
            }));
        } else {
            setEmployeeAvailabilityData(prev => {
                const newState = { ...prev };
                delete newState[dayOfWeek];
                return newState;
            });
        }
    };

    const handleSetAvailability = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!availabilityEmployeeSelect) {
                showMessageBox('Selecione um funcionário.', 'error');
                setLoading(false);
                return;
            }

            const days = Object.keys(employeeAvailabilityData).map(dayOfWeek => ({
                dayOfWeek: parseInt(dayOfWeek),
                intervals: [{
                    start: employeeAvailabilityData[dayOfWeek].start,
                    end: employeeAvailabilityData[dayOfWeek].end
                }]
            }));

            // Validação de horários
            let isValid = true;
            for (const day of days) {
                if (!day.intervals[0].start || !day.intervals[0].end) {
                    showMessageBox(`Preencha os horários para o dia ${day.dayOfWeek}.`, 'error');
                    isValid = false;
                    break;
                }
            }
            if (!isValid) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ employeeId: availabilityEmployeeSelect, days })
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
            } else {
                showMessageBox(data.message || 'Erro ao salvar disponibilidade.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para salvar disponibilidade.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ name: serviceName, price: parseFloat(servicePrice), duration: parseInt(serviceDuration) })
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
                setServiceName('');
                setServicePrice('');
                setServiceDuration('');
                await fetchServices();
            } else {
                showMessageBox(data.message || 'Erro ao adicionar serviço.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para adicionar serviço.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        const confirmed = await showCustomConfirm('Tem certeza que deseja deletar este serviço?');
        if (!confirmed) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
                await fetchServices();
            } else {
                showMessageBox(data.message || 'Erro ao deletar serviço.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para deletar serviço.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateAppointmentStatus = async (appointmentId, status) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ status })
            });
            const data = await response.json();

            if (response.ok) {
                showMessageBox(data.message, 'success');
                await fetchAppointments();
            } else {
                showMessageBox(data.message || 'Erro ao atualizar status.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para atualizar status.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePublicAppointmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!publicBookingEstablishmentId) {
                showMessageBox('Erro: ID do estabelecimento não encontrado na URL.', 'error');
                setLoading(false);
                return;
            }
            if (publicSelectedServices.length === 0) {
                showMessageBox('Selecione ao menos um serviço.', 'error');
                setLoading(false);
                return;
            }
            if (!publicSelectedDate) {
                showMessageBox('Selecione uma data para o agendamento.', 'error');
                setLoading(false);
                return;
            }
            if (!publicSelectedTime) {
                showMessageBox('Selecione um horário disponível.', 'error');
                setLoading(false);
                return;
            }

            const fullAppointmentDateTime = `${publicSelectedDate}T${publicSelectedTime}:00`;
            const redirectBaseUrl = window.location.origin; // A URL base do seu frontend

            const response = await fetch(`${API_BASE_URL}/public/appointments/initiate-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    establishmentId: publicBookingEstablishmentId,
                    employeeId: publicSelectedEmployee,
                    serviceIds: publicSelectedServices,
                    clientName: publicClientName,
                    clientPhone: publicClientPhone,
                    appointmentDate: fullAppointmentDateTime,
                    redirectBaseUrl: redirectBaseUrl
                })
            });
            const data = await response.json();

            if (response.ok && data.paymentLink) {
                showMessageBox('Redirecionando para o pagamento...', 'info');
                window.location.href = data.paymentLink;
            } else {
                showMessageBox(data.message || 'Erro ao iniciar agendamento e pagamento. Por favor, tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            showMessageBox('Erro ao conectar ao servidor para iniciar agendamento e pagamento.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToPlan = async (planType) => {
        if (!currentUser || currentUser.role !== 'establishment' || !currentUser.establishmentId) {
            showMessageBox('Você precisa estar logado como proprietário de um estabelecimento para assinar um plano.', 'error');
            return;
        }
        setLoading(true);
        try {
            const redirectBaseUrl = window.location.origin; // A URL base do seu frontend
            const response = await fetch(`${API_BASE_URL}/subscriptions/${planType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ redirectBaseUrl })
            });
            const data = await response.json();

            if (response.ok && data.init_point) {
                // Após a assinatura, o backend deve atualizar o planoAtivo do usuário
                // O frontend pode recarregar o usuário ou confiar no webhook do MP para atualização
                // Por simplicidade, vamos apenas redirecionar e o webhook do MP no backend cuidará da atualização.
                window.location.href = data.init_point;
            } else {
                showMessageBox(data.message || `Erro ao iniciar assinatura ${planType}.`, 'error');
            }
        } catch (error) {
            console.error(`Erro ao conectar ao servidor para assinar plano ${planType}:`, error);
            showMessageBox(`Erro ao conectar ao servidor para assinar plano ${planType}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Primeiro useEffect: Carrega os dados de autenticação na montagem inicial
    useEffect(() => {
        loadAuthData();
        // Não defina setLoading(false) aqui, pois o próximo useEffect lidará com a navegação
    }, [loadAuthData]);

    // Segundo useEffect: Lida com a navegação com base nas mudanças no estado currentUser
    useEffect(() => {
        // Procede apenas se currentUser for explicitamente null ou tiver dados (ou seja, não undefined da renderização inicial)
        // Isso evita que seja executado antes que loadAuthData tenha a chance de definir currentUser
        if (currentUser !== undefined) {
            const path = window.location.pathname;
            const urlParams = new URLSearchParams(window.location.search);
            const appointmentId = urlParams.get('appointmentId');

            if (path.startsWith('/payment-success') || path.startsWith('/payment-failure') || path.startsWith('/payment-pending')) {
                handlePaymentStatusPage(path, appointmentId);
            } else if (path.startsWith('/public/')) {
                const estId = path.split('/')[2];
                if (estId) {
                    setPublicBookingEstablishmentId(estId);
                    loadPublicBookingPage(estId);
                } else {
                    showSection(currentUser ? 'dashboard-section' : 'auth-section');
                }
            } else {
                // Caminhos de aplicativo regulares
                if (currentUser) {
                    handleUserPlanRedirection(currentUser);
                } else {
                    showSection('auth-section');
                }
            }
            setLoading(false); // Define loading como false assim que a lógica de navegação for concluída
        }
    }, [currentUser, showSection, handlePaymentStatusPage, loadPublicBookingPage, handleUserPlanRedirection]);


    return (
        <>
            <style>{appStyles}</style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <div className="main-flex-center">
                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner-animation"></div>
                    </div>
                )}

                {message.text && (
                    <div className={`message-box ${message.type}`}>
                        <p className="message-text">{message.text}</p>
                        <button onClick={() => setMessage({ text: '', type: '' })} className="message-close-btn">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}

                {showConfirmModal && (
                    <div id="custom-confirm-modal" className="modal flex">
                        <div className="modal-content">
                            <span className="close-button" onClick={() => handleConfirmResponse(false)}>&times;</span>
                            <p id="confirm-message" className="confirm-message">{confirmMessageText}</p>
                            <div className="confirm-buttons">
                                <button onClick={() => handleConfirmResponse(true)} className="confirm-btn confirm-yes-btn">Sim</button>
                                <button onClick={() => handleConfirmResponse(false)} className="confirm-btn confirm-no-btn">Não</button>
                            </div>
                        </div>
                    </div>
                )}

                {showAuthSection && (
                    <div id="auth-section" className="app-container section-spacing">
                        <h2 className="auth-section-title">Bem-vindo(a)!</h2>
                        <div className="auth-toggle-buttons">
                            <button
                                onClick={() => setShowLoginForm(true)}
                                className={`auth-toggle-btn ${showLoginForm ? 'active' : 'inactive'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setShowLoginForm(false)}
                                className={`auth-toggle-btn ${!showLoginForm ? 'active' : 'inactive'}`}
                            >
                                Registrar
                            </button>
                        </div>

                        {showLoginForm ? (
                            <form id="login-form" className="form-spacing" onSubmit={handleLoginSubmit}>
                                <div>
                                    <label htmlFor="login-email" className="form-label">Email:</label>
                                    <input type="email" id="login-email" className="form-input" placeholder="seu.email@exemplo.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="login-password" className="form-label">Senha:</label>
                                    <input type="password" id="login-password" className="form-input" placeholder="********" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                                </div>
                                <button type="submit" className="btn-action btn-purple btn-medium">Entrar</button>
                            </form>
                        ) : (
                            <form id="register-form" className="form-spacing" onSubmit={handleRegisterSubmit}>
                                <div>
                                    <label htmlFor="register-email" className="form-label">Email:</label>
                                    <input type="email" id="register-email" className="form-input" placeholder="seu.email@exemplo.com" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="register-password" className="form-label">Senha:</label>
                                    <input type="password" id="register-password" className="form-input" placeholder="********" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="register-role" className="form-label">Você é:</label>
                                    <select id="register-role" className="form-select" value={registerRole} onChange={(e) => setRegisterRole(e.target.value)}>
                                        <option value="establishment">Estabelecimento</option>
                                        <option value="employee">Funcionário</option>
                                    </select>
                                </div>
                                {registerRole === 'employee' && (
                                    <div id="establishment-id-field">
                                        <label htmlFor="register-establishment-id" className="form-label">ID do Estabelecimento (para Funcionários):</label>
                                        <input type="text" id="register-establishment-id" className="form-input" placeholder="ID do Estabelecimento" required={registerRole === 'employee'} value={registerEstablishmentId} onChange={(e) => setRegisterEstablishmentId(e.target.value)} />
                                    </div>
                                )}
                                <button type="submit" className="btn-action btn-purple btn-medium">Registrar</button>
                            </form>
                        )}
                    </div>
                )}

                {showPlansSection && (
                    <div id="plans-section" className="app-container section-spacing plans-section-title">
                        <h2 className="plans-section-title">Seu Plano Expirou ou Não Está Ativo!</h2>
                        <p className="plans-description">Para continuar usando todos os recursos, escolha um de nossos planos de assinatura:</p>

                        <div className="plan-cards-container">
                            {/* Plano Mensal */}
                            <div className="plan-card">
                                <h3 className="plan-title">Plano Mensal</h3>
                                <p className="plan-price">R$ 99,90<span className="plan-price-suffix">/mês</span></p>
                                <ul className="plan-features">
                                    <li><i className="fas fa-check-circle"></i> Gerenciamento completo de agendamentos</li>
                                    <li><i className="fas fa-check-circle"></i> Cadastro ilimitado de funcionários</li>
                                    <li><i className="fas fa-check-circle"></i> Cadastro ilimitado de serviços</li>
                                    <li><i className="fas fa-check-circle"></i> Link público personalizado para agendamentos</li>
                                    <li><i className="fas fa-check-circle"></i> Suporte prioritário</li>
                                </ul>
                                <button onClick={() => subscribeToPlan('monthly')} className="btn-action btn-purple btn-large">Assinar Plano Mensal</button>
                            </div>

                            {/* Plano Anual */}
                            <div className="plan-card">
                                <h3 className="plan-title">Plano Anual</h3>
                                <p className="plan-price">R$ 700,00<span className="plan-price-suffix">/ano</span></p>
                                <ul className="plan-features">
                                    <li><i className="fas fa-check-circle"></i> Todos os benefícios do Plano Mensal</li>
                                    <li><i className="fas fa-check-circle"></i> Economia de aproximadamente 41.6% (equivalente a 5 meses grátis!)</li>
                                    <li><i className="fas fa-check-circle"></i> Acesso antecipado a novos recursos</li>
                                    <li><i className="fas fa-check-circle"></i> Relatórios avançados de desempenho</li>
                                </ul>
                                <button onClick={() => subscribeToPlan('annual')} className="btn-action btn-purple btn-large">Assinar Plano Anual</button>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="logout-plans-btn">Sair</button>
                    </div>
                )}

                {showDashboardSection && (
                    <div id="dashboard-section" className="app-container section-spacing">
                        <h2 className="dashboard-title">Dashboard</h2>
                        <p className="welcome-text">Bem-vindo(a), <span className="welcome-text-highlight">{currentUser?.email}</span>!</p>
                        <p className="role-text">Seu papel: <span className="role-text-highlight">{currentUser?.role}</span></p>
                        <button onClick={handleLogout} className="dashboard-logout-btn"><i className="fas fa-sign-out-alt"></i> Sair</button>

                        {/* Navegação do Dashboard */}
                        <div className="dashboard-nav">
                            <button onClick={() => showDashboardContent('profile-section')} className={`dashboard-nav-btn ${dashboardActiveContent === 'profile-section' ? 'active' : ''}`}><i className="fas fa-user-circle"></i> Meu Perfil</button>
                            <button onClick={() => showDashboardContent('employees-section')} className={`dashboard-nav-btn ${dashboardActiveContent === 'employees-section' ? 'active' : ''}`}><i className="fas fa-users"></i> Funcionários</button>
                            <button onClick={() => showDashboardContent('availability-section')} className={`dashboard-nav-btn ${dashboardActiveContent === 'availability-section' ? 'active' : ''}`}><i className="fas fa-calendar-alt"></i> Disponibilidade</button>
                            <button onClick={() => showDashboardContent('services-section')} className={`dashboard-nav-btn ${dashboardActiveContent === 'services-section' ? 'active' : ''}`}><i className="fas fa-cut"></i> Serviços</button>
                            <button onClick={() => showDashboardContent('appointments-section')} className={`dashboard-nav-btn ${dashboardActiveContent === 'appointments-section' ? 'active' : ''}`}><i className="fas fa-clipboard-list"></i> Agendamentos</button>
                        </div>

                        {/* Seção de Perfil do Estabelecimento */}
                        {dashboardActiveContent === 'profile-section' && (
                            <div id="profile-section" className="dashboard-content-section form-spacing">
                                <h3 className="profile-section-title">Perfil do Estabelecimento</h3>
                                <form id="establishment-profile-form" className="form-spacing" onSubmit={handleEstablishmentProfileSubmit}>
                                    <div>
                                        <label htmlFor="establishment-name" className="profile-form-label">Nome:</label>
                                        <input type="text" id="establishment-name" className="profile-form-input" required value={establishmentName} onChange={(e) => setEstablishmentName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="establishment-address" className="profile-form-label">Endereço:</label>
                                        <input type="text" id="establishment-address" className="profile-form-input" required value={establishmentAddress} onChange={(e) => setEstablishmentAddress(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="establishment-phone" className="profile-form-label">Telefone:</label>
                                        <input type="text" id="establishment-phone" className="profile-form-input" required value={establishmentPhone} onChange={(e) => setEstablishmentPhone(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="establishment-description" className="profile-form-label">Descrição:</label>
                                        <textarea id="establishment-description" className="profile-form-textarea" rows="4" value={establishmentDescription} onChange={(e) => setEstablishmentDescription(e.target.value)}></textarea>
                                    </div>
                                    {currentEstablishmentPublicLink && (
                                        <div className="public-link-display">
                                            <p className="public-link-text">Link Público para Agendamentos:</p>
                                            <a href={currentEstablishmentPublicLink} target="_blank" rel="noopener noreferrer" className="public-link-value">{currentEstablishmentPublicLink}</a>
                                            <button type="button" onClick={copyPublicLink} className="btn-action btn-purple btn-small"><i className="fas fa-copy"></i> Copiar</button>
                                        </div>
                                    )}
                                    <button type="submit" className="btn-action btn-green btn-medium"><i className="fas fa-save"></i> Salvar Perfil</button>
                                </form>
                            </div>
                        )}

                        {/* Seção de Funcionários */}
                        {dashboardActiveContent === 'employees-section' && (
                            <div id="employees-section" className="dashboard-content-section form-spacing">
                                <h3 className="employees-section-title">Funcionários</h3>
                                <form id="add-employee-form" className="add-form-card form-spacing" onSubmit={handleAddEmployee}>
                                    <h4 className="add-form-title">Adicionar Novo Funcionário</h4>
                                    <div>
                                        <label htmlFor="employee-name" className="form-label">Nome:</label>
                                        <input type="text" id="employee-name" className="form-input" required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="employee-email" className="form-label">Email (Opcional, se tiver login):</label>
                                        <input type="email" id="employee-email" className="form-input" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="employee-phone" className="form-label">Telefone:</label>
                                        <input type="text" id="employee-phone" className="form-input" value={employeePhone} onChange={(e) => setEmployeePhone(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn-action btn-blue btn-medium"><i className="fas fa-plus-circle"></i> Adicionar Funcionário</button>
                                </form>

                                <h4 className="employee-list-title">Lista de Funcionários</h4>
                                <div id="employees-list" className="card-list-container">
                                    {employees.length === 0 ? (
                                        <p className="no-data-message">Nenhum funcionário cadastrado ainda.</p>
                                    ) : (
                                        employees.map(employee => (
                                            <div key={employee._id} className="item-card">
                                                <div>
                                                    <p className="item-name">{employee.name}</p>
                                                    <p className="item-details">{employee.email || 'N/A'}</p>
                                                    <p className="item-details">{employee.phone || 'N/A'}</p>
                                                </div>
                                                <div className="item-actions">
                                                    <button onClick={() => handleDeleteEmployee(employee._id)} className="btn-action btn-red btn-small"><i className="fas fa-trash-alt"></i></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Seção de Disponibilidade */}
                        {dashboardActiveContent === 'availability-section' && (
                            <div id="availability-section" className="dashboard-content-section form-spacing">
                                <h3 className="availability-section-title">Disponibilidade dos Funcionários</h3>
                                <form id="set-availability-form" className="add-form-card form-spacing" onSubmit={handleSetAvailability}>
                                    <h4 className="add-form-title">Definir Disponibilidade</h4>
                                    <div>
                                        <label htmlFor="availability-employee-select" className="form-label">Selecionar Funcionário:</label>
                                        <select id="availability-employee-select" className="form-select" required value={availabilityEmployeeSelect} onChange={(e) => {
                                            setAvailabilityEmployeeSelect(e.target.value);
                                            loadEmployeeAvailability(e.target.value);
                                        }}>
                                            <option value="">Selecione um Funcionário</option>
                                            {employeesForAvailability.map(employee => (
                                                <option key={employee._id} value={employee._id}>{employee.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-spacing">
                                        {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
                                            <div key={dayOfWeek} className="day-availability-item">
                                                <input
                                                    type="checkbox"
                                                    id={`day-${dayOfWeek}`}
                                                    data-day={dayOfWeek}
                                                    className="day-checkbox"
                                                    checked={!!employeeAvailabilityData[dayOfWeek]}
                                                    onChange={(e) => handleDayCheckboxChange(dayOfWeek, e.target.checked)}
                                                />
                                                <label htmlFor={`day-${dayOfWeek}`} className="day-label">
                                                    {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dayOfWeek]}
                                                </label>
                                                <input
                                                    type="time"
                                                    className="time-input"
                                                    disabled={!employeeAvailabilityData[dayOfWeek]}
                                                    value={employeeAvailabilityData[dayOfWeek]?.start || ''}
                                                    onChange={(e) => handleAvailabilityChange(dayOfWeek, 'start', e.target.value)}
                                                />
                                                <span className="time-separator">-</span>
                                                <input
                                                    type="time"
                                                    className="time-input"
                                                    disabled={!employeeAvailabilityData[dayOfWeek]}
                                                    value={employeeAvailabilityData[dayOfWeek]?.end || ''}
                                                    onChange={(e) => handleAvailabilityChange(dayOfWeek, 'end', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" className="btn-action btn-blue btn-medium"><i className="fas fa-save"></i> Salvar Disponibilidade</button>
                                </form>
                            </div>
                        )}

                        {/* Seção de Serviços */}
                        {dashboardActiveContent === 'services-section' && (
                            <div id="services-section" className="dashboard-content-section form-spacing">
                                <h3 className="services-section-title">Serviços</h3>
                                <form id="add-service-form" className="add-form-card form-spacing" onSubmit={handleAddService}>
                                    <h4 className="add-form-title">Adicionar Novo Serviço</h4>
                                    <div>
                                        <label htmlFor="service-name" className="form-label">Nome do Serviço:</label>
                                        <input type="text" id="service-name" className="form-input" required value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="service-price" className="form-label">Preço (R$):</label>
                                        <input type="number" id="service-price" className="form-input" step="0.01" required value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="service-duration" className="form-label">Duração (minutos):</label>
                                        <input type="number" id="service-duration" className="form-input" required value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn-action btn-blue btn-medium"><i className="fas fa-plus-circle"></i> Adicionar Serviço</button>
                                </form>

                                <h4 className="employee-list-title">Lista de Serviços</h4>
                                <div id="services-list" className="card-list-container">
                                    {services.length === 0 ? (
                                        <p className="no-data-message">Nenhum serviço cadastrado ainda.</p>
                                    ) : (
                                        services.map(service => (
                                            <div key={service._id} className="item-card">
                                                <div>
                                                    <p className="item-name">{service.name}</p>
                                                    <p className="item-details">R$ {service.price.toFixed(2)}</p>
                                                    <p className="item-details">{service.duration} minutos</p>
                                                </div>
                                                <div className="item-actions">
                                                    <button onClick={() => handleDeleteService(service._id)} className="btn-action btn-red btn-small"><i className="fas fa-trash-alt"></i></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Seção de Agendamentos */}
                        {dashboardActiveContent === 'appointments-section' && (
                            <div id="appointments-section" className="dashboard-content-section form-spacing">
                                <h3 className="appointments-section-title">Agendamentos</h3>
                                <div id="appointments-list" className="card-list-container">
                                    {appointments.length === 0 ? (
                                        <p className="no-data-message">Nenhum agendamento encontrado.</p>
                                    ) : (
                                        appointments.map(appointment => {
                                            const apptDate = new Date(appointment.appointmentDate);
                                            const formattedDate = apptDate.toLocaleDateString('pt-BR');
                                            const formattedTime = apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                            const serviceNames = appointment.serviceIds.map(s => s.name).join(', ');
                                            const totalAmount = appointment.totalAmount.toFixed(2);

                                            return (
                                                <div key={appointment._id} className="item-card">
                                                    <div>
                                                        <p className="item-name"><i className="fas fa-user"></i> Cliente: {appointment.clientName} (<a href={`tel:${appointment.clientPhone}`} className="item-details">{appointment.clientPhone}</a>)</p>
                                                        <p className="item-details"><i className="fas fa-cut"></i> Serviços: {serviceNames} (Total: <span className="item-name">R$ {totalAmount}</span>)</p>
                                                        <p className="item-details"><i className="fas fa-user-tie"></i> Funcionário: {appointment.employeeId?.name || 'N/A'}</p>
                                                        <p className="item-details"><i className="fas fa-clock"></i> Data/Hora: <span className="item-name">{formattedDate} às {formattedTime}</span></p>
                                                    </div>
                                                    <div className="appointment-status-container">
                                                        <span className={`appointment-status-text status-${appointment.status.replace('_', '-')}`}><i className="fas fa-info-circle"></i> Status: {appointment.status.replace('_', ' ')}</span>
                                                        <select
                                                            className="status-select"
                                                            value={appointment.status}
                                                            onChange={(e) => updateAppointmentStatus(appointment._id, e.target.value)}
                                                        >
                                                            <option value="pending_payment">Pendente Pagamento</option>
                                                            <option value="confirmed">Confirmado</option>
                                                            <option value="completed">Concluído</option>
                                                            <option value="cancelled">Cancelado</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {showPublicBookingSection && publicEstablishmentDetails && (
                    <div id="public-booking-section" className="app-container section-spacing">
                        <h2 className="public-section-title">{publicEstablishmentDetails.name}</h2>
                        <p className="public-section-description">{publicEstablishmentDetails.description || 'Bem-vindo(a)! Agende seu horário conosco.'}</p>

                        <form id="public-appointment-form" className="form-spacing" onSubmit={handlePublicAppointmentSubmit}>
                            <div className="public-form-group">
                                <label htmlFor="client-name" className="public-form-label">Seu Nome:</label>
                                <input type="text" id="client-name" className="public-form-input" required value={publicClientName} onChange={(e) => setPublicClientName(e.target.value)} />
                            </div>
                            <div className="public-form-group">
                                <label htmlFor="client-phone" className="public-form-label">Seu Telefone:</label>
                                <input type="text" id="client-phone" className="public-form-input" required value={publicClientPhone} onChange={(e) => setPublicClientPhone(e.target.value)} />
                            </div>
                            <div className="public-form-group">
                                <label htmlFor="select-services-public" className="public-form-label">Serviços:</label>
                                <select id="select-services-public" multiple className="public-form-select public-services-select" required value={publicSelectedServices} onChange={(e) => setPublicSelectedServices(Array.from(e.target.selectedOptions).map(option => option.value))}>
                                    {services.map(service => (
                                        <option key={service._id} value={service._id}>{service.name} (R$ {service.price.toFixed(2)} - {service.duration} min)</option>
                                    ))}
                                </select>
                                <p className="public-select-info">Selecione um ou mais serviços (segure Ctrl/Cmd para múltiplos).</p>
                            </div>
                            <div className="public-form-group">
                                <label htmlFor="select-employee-public" className="public-form-label">Funcionário:</label>
                                <select id="select-employee-public" className="public-form-select" required value={publicSelectedEmployee} onChange={(e) => setPublicSelectedEmployee(e.target.value)}>
                                    <option value="">Selecione um Funcionário</option>
                                    {employees.map(employee => (
                                        <option key={employee._id} value={employee._id}>{employee.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Calendário Aprimorado */}
                            <div className="public-form-group">
                                <label className="public-form-label">Selecione a Data:</label>
                                <div className="public-calendar-wrapper">
                                    <div className="calendar-header">
                                        <button type="button" onClick={() => changeMonth(-1)}><i className="fas fa-chevron-left"></i></button>
                                        <h4 id="current-month-year" className="public-form-label">
                                            {publicCurrentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                        </h4>
                                        <button type="button" onClick={() => changeMonth(1)}><i className="fas fa-chevron-right"></i></button>
                                    </div>
                                    <div className="calendar-grid">
                                        <div className="day-name">Dom</div>
                                        <div className="day-name">Seg</div>
                                        <div className="day-name">Ter</div>
                                        <div className="day-name">Qua</div>
                                        <div className="day-name">Qui</div>
                                        <div className="day-name">Sex</div>
                                        <div className="day-name">Sáb</div>
                                    </div>
                                    <div id="calendar-days" className="calendar-grid">
                                        {renderCalendarDays()}
                                    </div>
                                </div>
                            </div>

                            <div className="public-form-group">
                                <label className="public-form-label">Horários Disponíveis:</label>
                                <div id="available-times-public" className="time-slots-container">
                                    {publicAvailableTimes.length === 0 ? (
                                        <p className="no-data-message">Selecione uma data para ver os horários.</p>
                                    ) : (
                                        publicAvailableTimes.map(time => (
                                            <div
                                                key={time}
                                                className={`time-slot ${publicSelectedTime === time ? 'selected-time' : ''}`}
                                                onClick={() => setPublicSelectedTime(time)}
                                            >
                                                {time}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="btn-action btn-purple btn-medium"><i className="fas fa-calendar-check"></i> Agendar e Pagar</button>
                        </form>
                    </div>
                )}

                {showPaymentStatusPage && (
                    <div id="payment-status-page" className="app-container section-spacing payment-status-page">
                        <h2 className="payment-status-title">{paymentStatusTitle}</h2>
                        <p className="payment-status-message">{paymentStatusMessageText}</p>
                        <p className="countdown-text">Você será redirecionado em <span className="countdown-value">{countdown}</span> segundos...</p>
                        <button onClick={() => window.location.href = '/'} className="btn-action btn-purple btn-medium btn-go-home"><i className="fas fa-home"></i> Voltar para a Página Inicial</button>
                    </div>
                )}
            </div>
        </>
    );
};

export default App;
