<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Search } from 'lucide-vue-next';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: unknown;
  group?: string;
  badge?: string;
  shortcut?: string[];
  handler: () => void;
}

interface Props {
  commands?: Command[];
  placeholder?: string;
  recentLabel?: string;
  showFooter?: boolean;
  maxRecent?: number;
}

const props = withDefaults(defineProps<Props>(), {
  commands: () => [],
  placeholder: 'Search for commands...',
  recentLabel: 'Recent',
  showFooter: true,
  maxRecent: 5,
});

const emit = defineEmits<{
  select: [command: Command];
  close: [];
}>();

const isOpen = ref(false);
const query = ref('');
const highlightedIndex = ref(0);
const searchInput = ref<HTMLInputElement | null>(null);
const recentCommandIds = ref<string[]>([]);

const filteredCommands = computed(() => {
  if (!query.value) return [];

  const searchTerm = query.value.toLowerCase();
  return props.commands.filter(
    (command) =>
      command.label.toLowerCase().includes(searchTerm) ||
      command.description?.toLowerCase().includes(searchTerm) ||
      command.group?.toLowerCase().includes(searchTerm),
  );
});

const groupedCommands = computed(() => {
  const groups: Record<string, Command[]> = {};

  filteredCommands.value.forEach((command) => {
    const groupName = command.group || 'Commands';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(command);
  });

  return Object.entries(groups).map(([label, commands]) => ({
    label,
    commands,
  }));
});

const recentCommands = computed(() => {
  return recentCommandIds.value
    .map((id) => props.commands.find((cmd) => cmd.id === id))
    .filter((cmd): cmd is Command => cmd !== undefined)
    .slice(0, props.maxRecent);
});

const getCommandGlobalIndex = (
  groupIndex: number,
  commandIndex: number,
): number => {
  let index = 0;
  for (let i = 0; i < groupIndex; i++) {
    index += groupedCommands.value[i].commands.length;
  }
  return index + commandIndex;
};

const open = async (): Promise<void> => {
  isOpen.value = true;
  query.value = '';
  highlightedIndex.value = 0;
  await nextTick();
  searchInput.value?.focus();
};

const close = (): void => {
  isOpen.value = false;
  query.value = '';
  highlightedIndex.value = 0;
  emit('close');
};

const selectCommand = (command: Command): void => {
  command.handler();
  addToRecent(command.id);
  emit('select', command);
  close();
};

const selectHighlighted = (): void => {
  const commands = query.value ? filteredCommands.value : recentCommands.value;
  const command = commands[highlightedIndex.value];
  if (command) {
    selectCommand(command);
  }
};

const highlightNext = (): void => {
  const commands = query.value ? filteredCommands.value : recentCommands.value;
  highlightedIndex.value = (highlightedIndex.value + 1) % commands.length;
};

const highlightPrevious = (): void => {
  const commands = query.value ? filteredCommands.value : recentCommands.value;
  highlightedIndex.value =
    highlightedIndex.value === 0
      ? commands.length - 1
      : highlightedIndex.value - 1;
};

const addToRecent = (commandId: string): void => {
  const index = recentCommandIds.value.indexOf(commandId);
  if (index > -1) {
    recentCommandIds.value.splice(index, 1);
  }
  recentCommandIds.value.unshift(commandId);
  recentCommandIds.value = recentCommandIds.value.slice(0, props.maxRecent);

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'commandPaletteRecent',
      JSON.stringify(recentCommandIds.value),
    );
  }
};

const handleKeydown = (event: KeyboardEvent): void => {
  // Cmd+K or Ctrl+K to open
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  }
};

watch(query, () => {
  highlightedIndex.value = 0;
});

onMounted(() => {
  // Load recent commands from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('commandPaletteRecent');
    if (stored) {
      try {
        recentCommandIds.value = JSON.parse(stored);
      } catch {
        // Ignore parse errors
      }
    }
  }

  // Add keyboard listener
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Expose methods for parent components
defineExpose({
  open,
  close,
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="close"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm"
        ></div>

        <!-- Command Palette -->
        <div
          class="flex min-h-full items-start justify-center p-4 sm:p-6 md:p-20"
        >
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              class="relative w-full max-w-2xl transform rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all"
              @click.stop
            >
              <!-- Search Input -->
              <div class="relative">
                <Search
                  class="pointer-events-none absolute left-4 top-4 h-5 w-5 text-gray-400"
                />
                <input
                  ref="searchInput"
                  v-model="query"
                  type="text"
                  :placeholder="placeholder"
                  class="h-14 w-full border-0 bg-transparent pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  @keydown.down.prevent="highlightNext"
                  @keydown.up.prevent="highlightPrevious"
                  @keydown.enter.prevent="selectHighlighted"
                  @keydown.esc="close"
                />
              </div>

              <!-- Results -->
              <div
                v-if="filteredCommands.length > 0"
                class="max-h-96 scroll-py-2 overflow-y-auto border-t border-gray-200 dark:border-gray-700"
              >
                <div
                  v-for="(group, groupIndex) in groupedCommands"
                  :key="groupIndex"
                  class="p-2"
                >
                  <h3
                    v-if="group.label"
                    class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {{ group.label }}
                  </h3>

                  <div
                    v-for="(command, commandIndex) in group.commands"
                    :key="command.id"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                    :class="[
                      highlightedIndex ===
                      getCommandGlobalIndex(groupIndex, commandIndex)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                    ]"
                    @click="selectCommand(command)"
                    @mouseenter="
                      highlightedIndex = getCommandGlobalIndex(
                        groupIndex,
                        commandIndex,
                      )
                    "
                  >
                    <component
                      :is="command.icon"
                      v-if="command.icon"
                      class="h-5 w-5 flex-shrink-0"
                    />

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium truncate">{{
                          command.label
                        }}</span>
                        <span
                          v-if="command.badge"
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        >
                          {{ command.badge }}
                        </span>
                      </div>
                      <p
                        v-if="command.description"
                        class="text-sm text-gray-500 dark:text-gray-400 truncate"
                      >
                        {{ command.description }}
                      </p>
                    </div>

                    <div
                      v-if="command.shortcut"
                      class="flex items-center gap-1"
                    >
                      <kbd
                        v-for="(key, index) in command.shortcut"
                        :key="index"
                        class="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        {{ key }}
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div
                v-else-if="query"
                class="border-t border-gray-200 dark:border-gray-700 px-6 py-14 text-center sm:px-14"
              >
                <Search class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-4 text-sm text-gray-900 dark:text-white">
                  No results found for "{{ query }}"
                </p>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Try searching for something else
                </p>
              </div>

              <!-- Recent/Default Commands -->
              <div
                v-else
                class="border-t border-gray-200 dark:border-gray-700 px-6 py-4"
              >
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {{ recentLabel }}
                </p>
                <div class="space-y-1">
                  <div
                    v-for="(command, index) in recentCommands"
                    :key="command.id"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                    :class="[
                      highlightedIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                    ]"
                    @click="selectCommand(command)"
                    @mouseenter="highlightedIndex = index"
                  >
                    <component
                      :is="command.icon"
                      v-if="command.icon"
                      class="h-5 w-5 flex-shrink-0"
                    />
                    <span class="flex-1 truncate">{{ command.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div
                v-if="showFooter"
                class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400"
              >
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    <kbd
                      class="rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5"
                      >↑</kbd
                    >
                    <kbd
                      class="rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5"
                      >↓</kbd
                    >
                    to navigate
                  </span>
                  <span class="flex items-center gap-1">
                    <kbd
                      class="rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5"
                      >↵</kbd
                    >
                    to select
                  </span>
                  <span class="flex items-center gap-1">
                    <kbd
                      class="rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5"
                      >esc</kbd
                    >
                    to close
                  </span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
