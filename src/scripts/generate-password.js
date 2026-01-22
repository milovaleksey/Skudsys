#!/usr/bin/env node

/**
 * Скрипт для генерации bcrypt хеша пароля
 * Использование: node generate-password.js [пароль]
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const SALT_ROUNDS = 10;

async function generatePasswordHash(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('\n==============================================');
    console.log('✅ Хеш пароля успешно сгенерирован!');
    console.log('==============================================');
    console.log('\nИсходный пароль:', password);
    console.log('\nBcrypt хеш:');
    console.log(hash);
    console.log('\n==============================================');
    console.log('Скопируйте хеш выше и вставьте в SQL скрипт');
    console.log('==============================================\n');
  } catch (error) {
    console.error('❌ Ошибка генерации хеша:', error.message);
    process.exit(1);
  }
}

// Если пароль передан как аргумент
if (process.argv[2]) {
  generatePasswordHash(process.argv[2]);
} else {
  // Интерактивный режим
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Введите пароль: ', (password) => {
    if (!password || password.trim().length === 0) {
      console.error('❌ Пароль не может быть пустым!');
      process.exit(1);
    }

    generatePasswordHash(password.trim());
    rl.close();
  });
}
