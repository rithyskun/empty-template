<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue';
import { Zap } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left: Animated SVG Illustration -->
    <div
      class="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-primary-600 relative items-center justify-center overflow-hidden"
    >
      <!-- Background shapes -->
      <div class="absolute inset-0">
        <div
          class="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary-500/30 animate-pulse-slow"
        />
        <div
          class="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary-700/40 animate-pulse-slow-reverse"
        />
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary-400/20 animate-spin-slow"
        />
      </div>

      <!-- SVG Illustration -->
      <svg
        class="relative z-10 w-96 h-96"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Laptop base -->
        <g class="animate-float">
          <rect
            x="120"
            y="180"
            width="260"
            height="170"
            rx="12"
            fill="url(#g1)"
            stroke="white"
            stroke-width="1.5"
            stroke-opacity="0.3"
          />
          <!-- Screen bezel -->
          <rect
            x="135"
            y="195"
            width="230"
            height="140"
            rx="6"
            fill="#ffffff"
            fill-opacity="0.08"
            stroke="white"
            stroke-width="0.5"
            stroke-opacity="0.2"
          />

          <!-- Chart bars inside screen -->
          <rect
            x="155"
            y="290"
            width="16"
            height="35"
            rx="3"
            fill="white"
            fill-opacity="0.35"
          />
          <rect
            x="180"
            y="275"
            width="16"
            height="50"
            rx="3"
            fill="white"
            fill-opacity="0.5"
          />
          <rect
            x="205"
            y="260"
            width="16"
            height="65"
            rx="3"
            fill="white"
            fill-opacity="0.45"
          />
          <rect
            x="230"
            y="240"
            width="16"
            height="85"
            rx="3"
            fill="white"
            fill-opacity="0.6"
          />
          <rect
            x="255"
            y="265"
            width="16"
            height="60"
            rx="3"
            fill="white"
            fill-opacity="0.4"
          />
          <rect
            x="280"
            y="285"
            width="16"
            height="40"
            rx="3"
            fill="white"
            fill-opacity="0.3"
          />
          <rect
            x="305"
            y="270"
            width="16"
            height="55"
            rx="3"
            fill="white"
            fill-opacity="0.35"
          />

          <!-- Line overlay -->
          <polyline
            points="155,300 188,265 221,255 254,220 287,250 320,240"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            stroke-opacity="0.7"
            filter="url(#glow)"
          />
          <circle cx="320" cy="240" r="4" fill="white" />
        </g>

        <!-- Laptop keyboard base -->
        <path
          d="M100 350 L250 380 L400 350 L390 340 L250 365 L110 340 Z"
          fill="url(#g2)"
          stroke="white"
          stroke-width="1"
          stroke-opacity="0.2"
        />

        <!-- Pie chart card -->
        <g class="animate-float-delayed">
          <rect
            x="50"
            y="120"
            width="100"
            height="80"
            rx="10"
            fill="url(#g1)"
            stroke="white"
            stroke-width="1"
            stroke-opacity="0.25"
          />
          <circle
            cx="100"
            cy="160"
            r="22"
            fill="none"
            stroke="white"
            stroke-width="4"
            stroke-opacity="0.3"
          />
          <path
            d="M100 138 A22 22 0 0 1 122 160 L100 160 Z"
            fill="white"
            fill-opacity="0.5"
          />
          <rect
            x="70"
            y="195"
            width="40"
            height="4"
            rx="2"
            fill="white"
            fill-opacity="0.3"
          />
          <rect
            x="70"
            y="185"
            width="25"
            height="4"
            rx="2"
            fill="white"
            fill-opacity="0.5"
          />
        </g>

        <!-- Stats card -->
        <g class="animate-float-reverse">
          <rect
            x="340"
            y="100"
            width="110"
            height="90"
            rx="10"
            fill="url(#g1)"
            stroke="white"
            stroke-width="1"
            stroke-opacity="0.25"
          />
          <rect
            x="360"
            y="125"
            width="30"
            height="6"
            rx="3"
            fill="white"
            fill-opacity="0.4"
          />
          <rect
            x="360"
            y="140"
            width="50"
            height="4"
            rx="2"
            fill="white"
            fill-opacity="0.25"
          />
          <rect
            x="360"
            y="150"
            width="40"
            height="4"
            rx="2"
            fill="white"
            fill-opacity="0.25"
          />
          <!-- Mini sparkline -->
          <polyline
            points="360,175 375,165 390,170 405,155 420,160 435,145"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            stroke-opacity="0.6"
          />
        </g>

        <!-- Floating data points -->
        <g class="animate-float-delayed-2">
          <circle cx="80" cy="280" r="8" fill="white" fill-opacity="0.15" />
          <circle cx="80" cy="280" r="4" fill="white" fill-opacity="0.4" />
        </g>
        <g class="animate-float-reverse-2">
          <circle cx="420" cy="260" r="10" fill="white" fill-opacity="0.12" />
          <circle cx="420" cy="260" r="5" fill="white" fill-opacity="0.35" />
        </g>

        <!-- Horizontal dotted connection lines -->
        <line
          x1="150"
          y1="160"
          x2="340"
          y2="145"
          stroke="white"
          stroke-width="1"
          stroke-dasharray="4 4"
          stroke-opacity="0.2"
        />
        <line
          x1="100"
          y1="200"
          x2="120"
          y2="260"
          stroke="white"
          stroke-width="1"
          stroke-dasharray="4 4"
          stroke-opacity="0.15"
        />
        <line
          x1="390"
          y1="190"
          x2="380"
          y2="250"
          stroke="white"
          stroke-width="1"
          stroke-dasharray="4 4"
          stroke-opacity="0.15"
        />
      </svg>

      <!-- Brand text below SVG -->
      <div class="relative z-10 mt-8 text-center">
        <h2 class="text-3xl font-bold text-white tracking-tight">
          ERP Financial
        </h2>
        <p class="text-primary-100 mt-2 text-sm max-w-xs mx-auto">
          Streamline your banking operations with our comprehensive ERP solution
        </p>
      </div>
    </div>

    <!-- Right: Login Form -->
    <div
      class="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-6 py-12"
    >
      <div class="w-full max-w-md">
        <!-- Mobile brand -->
        <div class="lg:hidden text-center mb-8">
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-600 flex items-center justify-center"
          >
            <Zap class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
            ERP Financial
          </h1>
        </div>

        <div
          class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-8"
        >
          <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text mb-1">
            {{ $t('auth.signIn') }}
          </h1>
          <p class="text-gray-600 dark:text-dark-text-secondary text-sm mb-6">
            Enter your credentials to access your account.
          </p>
          <LoginForm />
        </div>

        <p
          class="mt-6 text-center text-xs text-gray-500 dark:text-dark-text-tertiary"
        >
          &copy; {{ new Date().getFullYear() }} ERP Financial. All rights
          reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
@keyframes float-reverse {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}
@keyframes spin-slow {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
.animate-float {
  animation: float 4s ease-in-out infinite;
}
.animate-float-delayed {
  animation: float 5s ease-in-out 0.5s infinite;
}
.animate-float-delayed-2 {
  animation: float 6s ease-in-out 1s infinite;
}
.animate-float-reverse {
  animation: float-reverse 4.5s ease-in-out infinite;
}
.animate-float-reverse-2 {
  animation: float-reverse 5.5s ease-in-out 0.5s infinite;
}
.animate-pulse-slow {
  animation: pulse-slow 6s ease-in-out infinite;
}
.animate-pulse-slow-reverse {
  animation: pulse-slow 7s ease-in-out 1s infinite reverse;
}
.animate-spin-slow {
  animation: spin-slow 30s linear infinite;
}
</style>
