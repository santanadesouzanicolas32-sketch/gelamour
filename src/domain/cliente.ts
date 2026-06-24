import { ValidationError } from '../core/errors';

export interface ClienteProps {
  id?: number;
  nome: string;
  telefone: string;
  endereco?: string;
}

export class Cliente {
  readonly id?: number;
  readonly nome: string;
  readonly telefone: string;
  readonly endereco?: string;

  private constructor(props: ClienteProps) {
    this.id = props.id;
    this.nome = props.nome;
    this.telefone = props.telefone;
    this.endereco = props.endereco;
  }

  static create(props: ClienteProps): Cliente {
    const tel = props.telefone.replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 11) {
      throw new ValidationError('Telefone inválido', { telefone: props.telefone });
    }
    if (!props.nome.trim()) {
      throw new ValidationError('Nome não pode ser vazio');
    }
    return new Cliente({
      ...props,
      telefone: tel,
      nome: Cliente.normalizarNome(props.nome),
    });
  }

  static fromDB(raw: ClienteProps): Cliente {
    return new Cliente(raw);
  }

  private static normalizarNome(nome: string): string {
    return nome.toLowerCase().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ').trim();
  }

  withEndereco(endereco: string): Cliente {
    return Cliente.fromDB({ ...this.toJSON(), endereco });
  }

  toJSON(): ClienteProps {
    return { id: this.id, nome: this.nome, telefone: this.telefone, endereco: this.endereco };
  }
}
