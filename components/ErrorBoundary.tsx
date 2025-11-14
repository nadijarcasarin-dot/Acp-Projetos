import React, { ErrorInfo, ReactNode } from 'react';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// FIX: Explicitly extending React.Component to fix type resolution issues where properties like 'props' and 'setState' were not being correctly inherited. The named 'Component' import has been removed.
class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erros
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Renderiza qualquer UI de fallback personalizada
      return (
        <div className="p-6 text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-800">Opa! Algo deu errado.</h1>
            <p className="mt-2 text-gray-600">
                Ocorreu um erro ao tentar carregar esta parte da aplicação.
            </p>
            <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
                Tentar Novamente
            </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
