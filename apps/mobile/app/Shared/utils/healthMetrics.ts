export const calculateIMC = (weightKg: number, heightCm: number): string => {
  if (!weightKg || !heightCm || heightCm === 0) return '0.0';
  const heightMeters = heightCm / 100;
  return (weightKg / (heightMeters * heightMeters)).toFixed(1);
};

export const getIMCCategory = (imcValue: string): string => {
  const imc = parseFloat(imcValue);
  if (imc === 0)                          return '-';
  if (imc < 18.5)                         return 'Bajo peso';
  if (imc >= 18.5 && imc <= 24.9)         return 'Peso normal';
  if (imc >= 25.0 && imc <= 29.9)         return 'Sobrepeso';
  return 'Obesidad';
};

export const calculateAge = (birthDateString: string): string => {
  if (!birthDateString) return '-';
  const diff = Date.now() - new Date(birthDateString).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970).toString();
};
