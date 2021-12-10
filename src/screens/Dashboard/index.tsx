import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';

import { HighLightCard } from '../../components/HighLightCard'
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard'

import { 
  Container,
  Header,
  LogoutButton,
  Icon,
  Photo,
  User,
  UserGreeting,
  UserInfo,
  UserName,
  UserWrapper,
  HighLightCards,
  Transactions,
  Title,
  TransactionList,
  LoadContainer
} from './styles'

export interface DataListProps extends TransactionCardProps {
  id: number;
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightData {
  entries: HighlightProps;
  expenses: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);

  const theme = useTheme();

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'  
  ) {

    const lastTransactions = Math.max.apply(Math, collection
      .filter((transaction) => transaction.type === type)
      .map((transaction) => new Date(transaction.date).getTime()));

    const formattedLastTransactions = Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long'
    }).format(new Date(lastTransactions));

    return formattedLastTransactions;
  }

  async function loadTransactions() {
    const dataKey = '@gofinances:transactions';
    const response = await AsyncStorage.getItem(dataKey);

    const transactions = !!response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensesTotal = 0;

    const formattedTransactions: DataListProps[] = transactions
    .map((item: DataListProps) => {

      if(item.type === 'positive') {
        entriesTotal += Number(item.amount)
      } else {
        expensesTotal += Number(item.amount)
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date));

      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category,
        date
      }

    });

    setTransactions(formattedTransactions);

    const lastTransactionsEntries = getLastTransactionDate(transactions, 'positive');
    const lastTransactionsExpenses = getLastTransactionDate(transactions, 'negative');
    const totalInterval = `01 a ${lastTransactionsExpenses}`;

    const total = entriesTotal - expensesTotal;

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última entrada dia ${lastTransactionsEntries}`
      },
      expenses: {
        amount: expensesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última saída dia ${lastTransactionsExpenses}`
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    })

    setIsLoading(false);

  }

  useEffect(() => {
    loadTransactions();
  }, [])

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []))

  return (
    <Container>
      {
        !!isLoading 
        ? (
          <LoadContainer>
            <ActivityIndicator 
              color={theme.colors.primary}
              size="large"
            />
          </LoadContainer>
        ) 
        : (
          <>
            <Header>
              <UserWrapper>
                <UserInfo>
                  <Photo source={{ uri: 'https://avatars.githubusercontent.com/u/57547336?v=4' }} />
                  <User>
                    <UserGreeting>Olá, </UserGreeting>
                    <UserName>André</UserName>
                  </User>
                </UserInfo>
                <LogoutButton onPress={() => {}}>
                  <Icon name="power" />
                </LogoutButton>
              </UserWrapper>
            </Header>
            <HighLightCards>
              <HighLightCard
                type="up"
                title="Entradas"
                amount={highlightData.entries.amount}
                lastTransaction={highlightData.entries.lastTransaction}
              />
              <HighLightCard
                type="down"
                title="Saídas"
                amount={highlightData.expenses.amount}
                lastTransaction={highlightData.expenses.lastTransaction}
              />
              <HighLightCard
                type="total"
                title="Total"
                amount={highlightData.total.amount}
                lastTransaction={highlightData.total.lastTransaction}
              />
            </HighLightCards>

            <Transactions>
              <Title>Listagem</Title>
              <TransactionList
                data={transactions}
                keyExtractor={item => item.id + item.name}
                renderItem={({ item }) => <TransactionCard data={item} />}
                
              />
            </Transactions>
          </>
        )
      }
    </Container>
  )
}


