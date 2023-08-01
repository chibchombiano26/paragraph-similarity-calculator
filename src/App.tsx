import { ChakraProvider, Box, Heading, Text, Button, Flex, Input, Spinner, Textarea } from "@chakra-ui/react";
import { Pipeline, pipeline, cos_sim } from '@xenova/transformers';
import { useEffect, useRef, useState } from "react";
import { Stack, HStack, VStack } from '@chakra-ui/react'


const useCompareParagraphs = () => {
  const [loadingModel, setLoadingModel] = useState(false);
  const modeRef = useRef<undefined | Pipeline>(undefined);
  const [paragraphs, setParagraphs] = useState<{
    paragraph: string;
    percentage: number;
    title?: string;
  }[]>([{
    paragraph: '',
    percentage: 0,
    title: 'Source'
  }, {
    paragraph: '',
    percentage: 0,
    title: 'Text to compare'
  }]);

  const loadModel = async () => {
    setLoadingModel(true);
    modeRef.current = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    setLoadingModel(false);
  }

  const calculateSimilarity = async (sentences: string[]) => {
    if (!modeRef.current) {
      throw new Error('Model not loaded');
    }

    let output = await modeRef.current(sentences, { pooling: 'mean', normalize: true });
    output = output.tolist()

    for (let i = 1; i < sentences.length; ++i) {
      const newParagraphs = [...paragraphs];
      newParagraphs[i].percentage = Math.floor(cos_sim(output[0], output[i]) * 100);
      setParagraphs(newParagraphs);
    }
  }

  useEffect(() => {
    loadModel()
  }, []);

  return { loadingModel, calculateSimilarity, paragraphs, setParagraphs };
}

const Loading = () => {
  return (
    <Spinner
      thickness="4px"
      speed="0.65s"
      emptyColor="gray.200"
      color="blue.500"
      size="xl"
    />
  );
};

type InputWithPercentageProps = {
  title: string;
  percentage: number;
  onChange: (value: string) => void;
};

function InputWithPercentage({ title, percentage, onChange }: InputWithPercentageProps) {
  return (
    <ChakraProvider>
      <Box p={4}>
        <VStack>
          <Text fontSize="xl" mr={2}>
            {title}
          </Text>
          <Textarea
            placeholder="Enter value"
            onChange={(e) => {
              onChange(e.target.value);
            }} />
          {percentage > 0 && <Text fontSize="xl" ml={2}>
            {percentage}%
          </Text>}
          </VStack>
      </Box>
    </ChakraProvider>
  );
}

function App() {
  const { loadingModel, calculateSimilarity, paragraphs, setParagraphs } = useCompareParagraphs();

  const onChange = (index: number, value: string) => {
    const newParagraphs = [...paragraphs];
    newParagraphs[index].paragraph = value;
    setParagraphs(newParagraphs);
  }

  const calculate = () => {

    // check that at least 2 paragraphs are filled
    if (paragraphs.filter((paragraph) => paragraph.paragraph.length > 0).length < 2) {
      alert('Please fill at least 2 paragraphs');
      return;
    }

    const paragraphsToCompare = paragraphs.map((paragraph) => paragraph.paragraph);
    calculateSimilarity(paragraphsToCompare);
  }


  if (loadingModel) {
    return <Loading />;
  }

  return (
    <ChakraProvider>
      <Box p={4}>
        <Heading as="h1" size="xl" mb={4}>
          Paragraph similarity calculator
        </Heading>
        {paragraphs.map((paragraph, index) => (
          <InputWithPercentage
            onChange={(value) => onChange(index, value)}
            key={index}
            title={paragraph.title || `Paragraph ${index}`}
            percentage={paragraph.percentage}
          />
        ))}
        <HStack>
          <Button colorScheme="blue" onClick={() => {
            const newParagraphs = [...paragraphs, { paragraph: '', percentage: 0 }];
            setParagraphs(newParagraphs);
          }
          }>Add paragraph</Button>
          <Button colorScheme="blue" onClick={calculate}>Calculate!</Button>
        </HStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;