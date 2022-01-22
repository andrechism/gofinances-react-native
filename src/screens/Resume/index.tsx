import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VictoryPie } from 'victory-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from 'styled-components'

import { HistoryCard } from '../../components/HistoryCard';
import {
  Container,
  Header,
  Title,
  Content,
  ChartContainer,
  MonthSelect,
  MonthSelectButton,
  SelectIcon,
  Month,
  LoadContainer
} from './styles';
import { categories } from '../../utils/categories';
import { useAuth } from '../../hooks/auth';

interface TransactionData {
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface CategoryData {
  key: string;
  name: string;
  total: number;
  formattedTotal: string;
  color: string;
  percentage: string;
}

export function Resume() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);

  const theme = useTheme();
  const { user } = useAuth()

  function handleDateChange(action: 'next' | 'prev') {
    if (action === 'next') {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
    } else {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
    }
  }

  async function loadData() {
    setIsLoading(true);
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const formattedResponse = !!response ? JSON.parse(response) : [];

    const expenses = formattedResponse
    .filter((expense: TransactionData) => 
    expense.type === 'negative'
    && new Date(expense.date).getMonth() === selectedDate.getMonth()
    && new Date(expense.date).getFullYear() === selectedDate.getFullYear()
    );

    const totalExpenses = expenses.reduce((acc: number, expense: TransactionData) => {
      return acc + Number(expense.amount);
    }, 0)

    const totalByCategory = categories.reduce((acc, category) => {
      
      const categorySum = expenses.reduce((a: number, expense: TransactionData) => {
        
        if (expense.category == category.key) {
          return a += Number(expense.amount);
        }
        
        return a;
      }, 0)

      
      if (categorySum > 0) {
        
        const formattedTotal = categorySum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })

        const percentage = `${(categorySum / totalExpenses * 100).toFixed(2)}%`;

        const newTotalByCategoryItem = {
          key: category.key,
          name: category.name,
          total: categorySum,
          formattedTotal,
          color: category.color,
          percentage
        }

        return [...acc, newTotalByCategoryItem];
      }

      return acc;

    }, [] as CategoryData[]);

    setTotalByCategories(totalByCategory);
    setIsLoading(false);
  }

  useFocusEffect(useCallback(() => {
    loadData();
  }, [selectedDate]))

  return (
    <Container>

      <Header>
        <Title>Resumo por categoria</Title>
      </Header>

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
            <Content
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: useBottomTabBarHeight()
              }}
            >

              <MonthSelect>
                <MonthSelectButton onPress={() => handleDateChange('prev')}>
                  <SelectIcon name="chevron-left" />
                </MonthSelectButton>

                <Month>{format(selectedDate, 'MMMM, yyyy', { locale: ptBR })}</Month>

                <MonthSelectButton onPress={() => handleDateChange('next')}>
                  <SelectIcon name="chevron-right" />
                </MonthSelectButton>

              </MonthSelect>

              <ChartContainer>
                <VictoryPie 
                  data={totalByCategories}
                  colorScale={totalByCategories.map(category => category.color)}
                  style={{
                    labels: {
                      fontSize: RFValue(18),
                      fontWeight: 'bold',
                      fill: theme.colors.shape
                    }
                  }}
                  labelRadius={50}
                  x="percentage"
                  y="total"
                />
              </ChartContainer>

              {
                totalByCategories.map((item) => (
                  <HistoryCard
                    key={item.key}
                    title={item.name}
                    amount={item.formattedTotal}
                    color={item.color}
                  />
                ))
              }
            </Content>
        )
      }

      

    </Container>
  )
}