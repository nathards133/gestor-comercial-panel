export const formatarQuantidade = (quantidade, unidade) => {
  if (typeof quantidade !== 'number') {
    return 'Quantidade inválida';
  }

  if (unidade === 'kg') {
    const quantidadeFormatada = quantidade.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });
    return `${quantidadeFormatada} ${unidade}`;
  } else {
    return `${quantidade} ${unidade}`;
  }
};
