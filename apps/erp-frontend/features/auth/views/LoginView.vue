<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import LoginForm from '../components/LoginForm.vue';

const currentSlide = ref(0);
let carouselInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  carouselInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % 2;
  }, 5000);
});

onUnmounted(() => {
  clearInterval(carouselInterval);
});
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left: Brand Illustration Panel -->
    <div
      class="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-[#f0f9fa] dark:bg-[#0a2a33] relative items-center justify-center overflow-hidden"
    >
      <!-- Background shapes -->
      <div class="absolute inset-0">
        <div
          class="absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-[#055f7c]/8 animate-pulse-slow"
        />
        <div
          class="absolute -bottom-20 -right-20 w-[24rem] h-[24rem] rounded-full bg-[#0097a7]/8 animate-pulse-slow-reverse"
        />
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-[#055f7c]/10 animate-spin-slow"
        />
      </div>

      <!-- Center content -->
      <div
        class="relative z-10 flex flex-col items-center text-center animate-slide-in-left"
      >
        <!-- Brand Logo Block -->
        <!-- <div
          class="mb-6 w-28 h-28 rounded-3xl bg-white/70 dark:bg-white/10 backdrop-blur-sm shadow-lg border border-white/50 dark:border-white/10 flex items-center justify-center"
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <rect
              x="8"
              y="28"
              width="56"
              height="36"
              rx="6"
              fill="#055f7c"
              fill-opacity="0.12"
            />
            <rect
              x="14"
              y="34"
              width="44"
              height="24"
              rx="3"
              fill="#055f7c"
              fill-opacity="0.2"
            />
            <rect x="18" y="46" width="8" height="12" rx="1.5" fill="#055f7c" />
            <rect x="30" y="40" width="8" height="18" rx="1.5" fill="#0097a7" />
            <rect
              x="42"
              y="36"
              width="8"
              height="22"
              rx="1.5"
              fill="#055f7c"
              fill-opacity="0.7"
            />
            <path
              d="M18 52 L30 44 L42 40 L54 34"
              stroke="#0097a7"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="54" cy="34" r="2.5" fill="#e31013" />
          </svg>
        </div> -->

        <!-- Brand Title -->
        <div class="inline-flex items-center mb-3">
          <span
            class="text-[2.5rem] font-extrabold text-aba tracking-[0.04em] dark:text-[#80cbc4]"
          >
            ABA
          </span>
          <span
            class="text-[2.1rem] font-extrabold text-accent relative -top-1"
          >
            '
          </span>
          <span
            class="text-[2.5rem] font-semibold text-financial tracking-[-0.01em] ml-1.5 dark:text-[#4fc3f7]"
          >
            Financial
          </span>
        </div>

        <!-- Subtitle -->
        <p
          class="text-lg text-[#055f7c]/70 dark:text-[#80cbc4]/80 m-0 max-w-sm leading-relaxed"
        >
          Streamline your banking operations with our comprehensive ERP solution
        </p>

        <!-- SVG Carousel -->
        <div class="relative w-[240px] h-[120px] mt-8 mx-auto overflow-hidden">
          <TransitionGroup
            name="svg-carousel"
            tag="div"
            class="relative w-full h-full"
          >
            <!-- Slide 1: Bar Chart -->
            <div
              v-if="currentSlide === 0"
              key="slide-0"
              class="absolute inset-0"
            >
              <svg
                width="240"
                height="120"
                viewBox="0 0 240 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="10"
                  y="80"
                  width="14"
                  height="40"
                  rx="3"
                  fill="#055f7c"
                  fill-opacity="0.3"
                >
                  <animate
                    attributeName="height"
                    values="0;40"
                    dur="1.2s"
                    begin="0.2s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;80"
                    dur="1.2s"
                    begin="0.2s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="34"
                  y="60"
                  width="14"
                  height="60"
                  rx="3"
                  fill="#0097a7"
                  fill-opacity="0.4"
                >
                  <animate
                    attributeName="height"
                    values="0;60"
                    dur="1.2s"
                    begin="0.35s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;60"
                    dur="1.2s"
                    begin="0.35s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="58"
                  y="45"
                  width="14"
                  height="75"
                  rx="3"
                  fill="#055f7c"
                  fill-opacity="0.5"
                >
                  <animate
                    attributeName="height"
                    values="0;75"
                    dur="1.2s"
                    begin="0.5s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;45"
                    dur="1.2s"
                    begin="0.5s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="82"
                  y="55"
                  width="14"
                  height="65"
                  rx="3"
                  fill="#0097a7"
                  fill-opacity="0.35"
                >
                  <animate
                    attributeName="height"
                    values="0;65"
                    dur="1.2s"
                    begin="0.65s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;55"
                    dur="1.2s"
                    begin="0.65s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="106"
                  y="35"
                  width="14"
                  height="85"
                  rx="3"
                  fill="#055f7c"
                  fill-opacity="0.6"
                >
                  <animate
                    attributeName="height"
                    values="0;85"
                    dur="1.2s"
                    begin="0.8s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;35"
                    dur="1.2s"
                    begin="0.8s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="130"
                  y="50"
                  width="14"
                  height="70"
                  rx="3"
                  fill="#0097a7"
                  fill-opacity="0.45"
                >
                  <animate
                    attributeName="height"
                    values="0;70"
                    dur="1.2s"
                    begin="0.95s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;50"
                    dur="1.2s"
                    begin="0.95s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="154"
                  y="70"
                  width="14"
                  height="50"
                  rx="3"
                  fill="#055f7c"
                  fill-opacity="0.25"
                >
                  <animate
                    attributeName="height"
                    values="0;50"
                    dur="1.2s"
                    begin="1.1s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;70"
                    dur="1.2s"
                    begin="1.1s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="178"
                  y="58"
                  width="14"
                  height="62"
                  rx="3"
                  fill="#0097a7"
                  fill-opacity="0.5"
                >
                  <animate
                    attributeName="height"
                    values="0;62"
                    dur="1.2s"
                    begin="1.25s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;58"
                    dur="1.2s"
                    begin="1.25s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <rect
                  x="202"
                  y="40"
                  width="14"
                  height="80"
                  rx="3"
                  fill="#055f7c"
                  fill-opacity="0.45"
                >
                  <animate
                    attributeName="height"
                    values="0;80"
                    dur="1.2s"
                    begin="1.4s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="y"
                    values="120;40"
                    dur="1.2s"
                    begin="1.4s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </rect>
                <path
                  d="M17 85 L41 55 L65 35 L89 45 L113 25 L137 40 L161 60 L185 48 L209 30"
                  stroke="#e31013"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                  stroke-opacity="0.8"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    values="0,300;300,0"
                    dur="1.5s"
                    begin="0.6s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </path>
                <circle cx="17" cy="85" r="3" fill="#e31013" fill-opacity="0.7">
                  <animate
                    attributeName="r"
                    values="0;3"
                    dur="0.4s"
                    begin="1.8s"
                    fill="freeze"
                  />
                </circle>
                <circle
                  cx="113"
                  cy="25"
                  r="3"
                  fill="#e31013"
                  fill-opacity="0.7"
                >
                  <animate
                    attributeName="r"
                    values="0;3"
                    dur="0.4s"
                    begin="2.0s"
                    fill="freeze"
                  />
                </circle>
                <circle
                  cx="209"
                  cy="30"
                  r="3"
                  fill="#e31013"
                  fill-opacity="0.7"
                >
                  <animate
                    attributeName="r"
                    values="0;3"
                    dur="0.4s"
                    begin="2.2s"
                    fill="freeze"
                  />
                </circle>
              </svg>
            </div>

            <!-- Slide 2: Area Chart -->
            <div v-else key="slide-1" class="absolute inset-0">
              <svg
                width="240"
                height="120"
                viewBox="0 0 240 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <!-- Grid lines -->
                <line
                  x1="0"
                  y1="30"
                  x2="240"
                  y2="30"
                  stroke="#055f7c"
                  stroke-opacity="0.08"
                  stroke-width="1"
                />
                <line
                  x1="0"
                  y1="60"
                  x2="240"
                  y2="60"
                  stroke="#055f7c"
                  stroke-opacity="0.08"
                  stroke-width="1"
                />
                <line
                  x1="0"
                  y1="90"
                  x2="240"
                  y2="90"
                  stroke="#055f7c"
                  stroke-opacity="0.08"
                  stroke-width="1"
                />

                <!-- Area fill -->
                <path
                  d="M0 95 C30 85, 50 55, 80 65 C110 75, 130 35, 160 45 C190 55, 210 25, 240 15 L240 120 L0 120 Z"
                  fill="#055f7c"
                  fill-opacity="0.12"
                >
                  <animate
                    attributeName="fill-opacity"
                    values="0;0.12"
                    dur="1s"
                    begin="0.3s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </path>

                <!-- Main line -->
                <path
                  d="M0 95 C30 85, 50 55, 80 65 C110 75, 130 35, 160 45 C190 55, 210 25, 240 15"
                  stroke="#055f7c"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                  stroke-opacity="0.7"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    values="0,400;400,0"
                    dur="1.4s"
                    begin="0.2s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </path>

                <!-- Peak indicator -->
                <circle
                  cx="240"
                  cy="15"
                  r="0"
                  fill="#e31013"
                  fill-opacity="0.8"
                >
                  <animate
                    attributeName="r"
                    values="0;5"
                    dur="0.5s"
                    begin="1.2s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                </circle>
                <circle
                  cx="240"
                  cy="15"
                  r="0"
                  fill="none"
                  stroke="#e31013"
                  stroke-width="1.5"
                  stroke-opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    values="0;10"
                    dur="0.8s"
                    begin="1.4s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.5;0"
                    dur="0.8s"
                    begin="1.4s"
                    fill="freeze"
                  />
                </circle>

                <!-- Data points -->
                <circle
                  cx="0"
                  cy="95"
                  r="3"
                  fill="#0097a7"
                  fill-opacity="0.6"
                />
                <circle cx="80" cy="65" r="3" fill="#0097a7" fill-opacity="0.6">
                  <animate
                    attributeName="r"
                    values="0;3"
                    dur="0.3s"
                    begin="0.8s"
                    fill="freeze"
                  />
                </circle>
                <circle
                  cx="160"
                  cy="45"
                  r="3"
                  fill="#0097a7"
                  fill-opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="0;3"
                    dur="0.3s"
                    begin="1.0s"
                    fill="freeze"
                  />
                </circle>
                <circle
                  cx="240"
                  cy="15"
                  r="3"
                  fill="#0097a7"
                  fill-opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="0;3"
                    dur="0.3s"
                    begin="1.2s"
                    fill="freeze"
                  />
                </circle>

                <!-- Growth arrow -->
                <path
                  d="M210 8 L220 2 L220 6 L228 6 L228 10 L220 10 L220 14 Z"
                  fill="#0097a7"
                  fill-opacity="0.7"
                >
                  <animate
                    attributeName="opacity"
                    values="0;1"
                    dur="0.5s"
                    begin="1.6s"
                    fill="freeze"
                  />
                </path>
              </svg>
            </div>
          </TransitionGroup>
        </div>

        <!-- Decorative dots -->
        <div class="flex items-center gap-2 mt-8">
          <span class="w-2 h-2 rounded-full bg-[#055f7c]/40" />
          <span class="w-2 h-2 rounded-full bg-[#0097a7]/40" />
          <span class="w-2 h-2 rounded-full bg-accent/40" />
        </div>
      </div>
    </div>

    <!-- Right: Login Form -->
    <div
      class="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-6 py-12"
    >
      <div class="w-full max-w-md animate-slide-in-right">
        <!-- Mobile brand -->
        <div class="lg:hidden text-center mb-8">
          <div class="inline-flex items-center justify-center mb-2">
            <span
              class="text-aba font-extrabold tracking-[0.04em] dark:text-[#80cbc4]"
            >
              ABA
            </span>
            <span
              class="text-[1.6rem] font-extrabold text-accent relative -top-0.5"
            >
              '
            </span>
            <span
              class="text-financial font-semibold tracking-[-0.01em] ml-1.5 dark:text-[#4fc3f7]"
            >
              Financial
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-dark-text-secondary m-0">
            Streamline your banking operations
          </p>
        </div>

        <!-- Brand title at top of right panel -->
        <div class="hidden lg:flex items-center gap-1.5 mb-8">
          <span
            class="text-xl font-extrabold text-aba tracking-[0.04em] dark:text-[#80cbc4]"
          >
            ABA
          </span>
          <span class="text-lg font-extrabold text-accent relative -top-0.5">
            '
          </span>
          <span
            class="text-xl font-semibold text-financial tracking-[-0.01em] ml-1 dark:text-[#4fc3f7]"
          >
            Financial
          </span>
        </div>

        <!-- Sign In heading -->
        <div class="mb-8">
          <h1
            class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2"
          >
            {{ $t('auth.signIn') }}
          </h1>
          <p class="text-gray-500 dark:text-dark-text-secondary text-sm">
            Enter your credentials to access your account.
          </p>
        </div>

        <LoginForm />

        <p
          class="mt-6 text-center text-xs text-gray-500 dark:text-dark-text-tertiary"
        >
          &copy; {{ new Date().getFullYear() }} ABA Bank. All rights reserved.
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

/* Slide-in from left on page load */
@keyframes slide-in-left {
  0% {
    opacity: 0;
    transform: translateX(-60px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-slide-in-left {
  animation: slide-in-left 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Slide-in from right on page load */
@keyframes slide-in-right {
  0% {
    opacity: 0;
    transform: translateX(40px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-slide-in-right {
  animation: slide-in-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
  opacity: 0;
}

/* SVG carousel cross-fade */
.svg-carousel-enter-active,
.svg-carousel-leave-active {
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}
.svg-carousel-enter-from {
  opacity: 0;
  transform: scale(0.96);
}
.svg-carousel-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
.svg-carousel-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
