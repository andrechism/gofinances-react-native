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
import { useAuth } from '../../hooks/auth';

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
  const { signOut, user } = useAuth()

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'  
  ) {

    const filteredTransaction = collection.filter((transaction) => transaction.type === type)
    console.log('filteredTransaction', filteredTransaction)

    if(filteredTransaction.length === 0) {
      return 0
    }

    const lastTransactions = Math.max.apply(
      Math,
      filteredTransaction
      .map((transaction) => new Date(transaction.date).getTime()));

    const formattedLastTransactions = Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long'
    }).format(new Date(lastTransactions));

    return formattedLastTransactions;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
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

    if (!formattedTransactions.length) {
      setIsLoading(false)
    }

    const lastTransactionsEntries = transactions.length ? getLastTransactionDate(transactions, 'positive') : null;
    const lastTransactionsExpenses = transactions.length ? getLastTransactionDate(transactions, 'negative') : null;


    const totalInterval = lastTransactionsExpenses === 0
    ? 'N??o h?? transa????es'
    : `01 a ${lastTransactionsExpenses}`;

    const total = entriesTotal - expensesTotal;

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionsEntries === 0 
        ? 'N??o h?? transa????es' 
        : `??ltima entrada dia ${lastTransactionsEntries}`
      },
      expenses: {
        amount: expensesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionsExpenses === 0 
        ? 'N??o h?? transa????es' 
        : `??ltima sa??da dia ${lastTransactionsExpenses}`
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
    loadTransactions()
  }, [])

  useFocusEffect(useCallback(() => {
    loadTransactions()
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
                  <Photo
                    source={{ uri: user.photo }}
                  />
                  <User>
                    <UserGreeting>Ol??, </UserGreeting>
                    <UserName>{user.name}</UserName>
                  </User>
                </UserInfo>
                <LogoutButton onPress={signOut}>
                  <Icon name="power" />
                </LogoutButton>
              </UserWrapper>
            </Header>
              {
                transactions.length > 1 && (
                  <HighLightCards>
                    <HighLightCard
                      type="up"
                      title="Entradas"
                      amount={highlightData.entries.amount}
                      lastTransaction={highlightData.entries.lastTransaction}
                    />
                    <HighLightCard
                      type="down"
                      title="Sa??das"
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
                )
              }
              

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


