# Примеры использования CacheUtils

Этот файл содержит примеры использования утилит для управления кэшем Service Worker и работы с офлайн-мутациями.

## Базовое использование

```typescript
import {
  invalidateAllApiCache,
  invalidateUrlCache,
  useCacheInvalidation,
} from "./cacheUtils";

// Инвалидация всего API кэша
async function clearAllCache() {
  try {
    await invalidateAllApiCache();
    console.log("Кэш успешно очищен");
  } catch (error) {
    console.error("Ошибка при очистке кэша:", error);
  }
}

// Инвалидация кэша для конкретного URL
async function clearSpecificCache() {
  try {
    await invalidateUrlCache("/api/trainings");
    console.log("Кэш для /api/trainings очищен");
  } catch (error) {
    console.error("Ошибка при очистке кэша:", error);
  }
}
```

## Использование в React компоненте

```typescript
import React, { useEffect } from 'react';
import { useCacheInvalidation } from './cacheUtils';

function TrainingForm({ onSubmit }) {
  const { invalidateCache } = useCacheInvalidation();

  const handleSubmit = async (formData) => {
    try {
      // Отправляем данные на сервер
      const response = await fetch('/api/trainings', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Инвалидируем кэш после успешного создания тренировки
        await invalidateCache();
        onSubmit();
      }
    } catch (error) {
      console.error('Ошибка при создании тренировки:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Форма */}
    </form>
  );
}
```

## Работа с офлайн-мутациями

```typescript
import { useOfflineMutation, useNetworkStatus } from './cacheUtils';

function TrainingFormWithOfflineSupport() {
  const { performMutation } = useOfflineMutation();
  const isOnline = useNetworkStatus();

  const handleSubmit = async (formData) => {
    const result = await performMutation(
      '/api/trainings',
      'POST',
      formData
    );

    if (result.success) {
      if (result.offline) {
        alert('Данные сохранены в офлайн-режиме и будут синхронизированы при восстановлении соединения');
      } else {
        alert('Данные успешно сохранены');
      }
    } else {
      alert('Ошибка при сохранении данных');
    }
  };

  return (
    <div>
      <p>Статус сети: {isOnline ? 'Онлайн' : 'Офлайн'}</p>
      <form onSubmit={handleSubmit}>
        {/* Форма */}
      </form>
    </div>
  );
}
```

## Интеграция с React Query

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateAllApiCache, useOfflineMutation } from "./cacheUtils";

function useCreateTraining() {
  const queryClient = useQueryClient();
  const { performMutation } = useOfflineMutation();

  return useMutation({
    mutationFn: async (newTraining) => {
      const result = await performMutation(
        "/api/trainings",
        "POST",
        newTraining,
      );

      if (!result.success) {
        throw new Error("Failed to create training");
      }

      return result.data;
    },
    onSuccess: async () => {
      // Инвалидируем кэш React Query
      await queryClient.invalidateQueries({ queryKey: ["trainings"] });

      // Инвалидируем Service Worker кэш
      await invalidateAllApiCache();
    },
  });
}
```

## Проверка доступности Service Worker

```typescript
import {
  isServiceWorkerSupported,
  isServiceWorkerRegistered,
} from "./cacheUtils";

async function checkServiceWorkerStatus() {
  const isSupported = isServiceWorkerSupported();
  console.log("Service Worker поддерживается:", isSupported);

  if (isSupported) {
    const isRegistered = await isServiceWorkerRegistered();
    console.log("Service Worker зарегистрирован:", isRegistered);
  }
}
```

## Стратегии кэширования

Service Worker автоматически обрабатывает следующие стратегии:

1. **Статические ресурсы**: Cache First (кэш сначала)
2. **API запросы (GET)**: Network First с падением на кэш
3. **API мутации (POST/PUT/DELETE)**: Офлайн-очередь с синхронизацией

## Офлайн-режим

При работе в офлайн-режиме:

- **GET запросы**: Возвращают кэшированные данные
- **Мутации (POST/PUT/DELETE)**: Добавляются в очередь и синхронизируются при восстановлении соединения
- **Синхронизация**: Автоматически запускается при возврате онлайн
- **Оптимистичные ответы**: Мутации возвращают успешный ответ даже в офлайн-режиме

## Пример полного компонента с офлайн-поддержкой

```typescript
import React, { useState, useEffect } from 'react';
import { useOfflineMutation, useNetworkStatus, useCacheInvalidation } from './cacheUtils';

function TrainingList() {
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useNetworkStatus();
  const { performMutation } = useOfflineMutation();
  const { invalidateCache } = useCacheInvalidation();

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/trainings');
        const data = await response.json();
        setTrainings(data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Добавление новой тренировки
  const handleAddTraining = async (newTraining) => {
    const result = await performMutation(
      '/api/trainings',
      'POST',
      newTraining
    );

    if (result.success) {
      // Оптимистичное обновление UI
      setTrainings([...trainings, { ...newTraining, id: 'temp' }]);

      // Инвалидация кэша
      await invalidateCache();

      if (result.offline) {
        alert('Тренировка сохранена в офлайн-режиме');
      }
    }
  };

  return (
    <div>
      <h2>Тренировки</h2>
      <p>Статус: {isOnline ? 'Онлайн' : 'Офлайн'}</p>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <ul>
          {trainings.map(training => (
            <li key={training.id}>{training.name}</li>
          ))}
        </ul>
      )}

      <button onClick={() => handleAddTraining({ name: 'Новая тренировка' })}>
        Добавить тренировку
      </button>
    </div>
  );
}
```
