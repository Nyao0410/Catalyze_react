import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ReviewEvaluationScreen } from '../ReviewEvaluationScreen';
import * as hooks from '../../hooks/useReviewItems';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { reviewItemIds: ['r1', 'r2', 'r3'], planId: 'plan-001', startUnit: 1, endUnit: 3 } }),
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../hooks/useReviewItems');

describe('ReviewEvaluationScreen', () => {
  it('calls recordReview.mutateAsync for each id when submitted', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    (hooks.useRecordReview as jest.Mock).mockReturnValue({ mutateAsync: mockMutateAsync });

    const { getByText } = render(<ReviewEvaluationScreen />);

    // choose quality 4
    const choice = getByText('4');
    fireEvent.press(choice);

    const submit = getByText('送信');
    fireEvent.press(submit);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    });
  });
});
