#include <stdio.h>
int main()
{
    int beg, end, mid, i, item, n;

    printf("\n Please enter number of elements in an array: ");
    scanf("%d", &n);

    int data[n];
    printf("Enter the sorted data: ");

    for (i = 0; i < n; ++i)
        scanf("%d", &data[i]);

    printf("Enter the search item= \n");
    scanf("%d", &item);

    beg = 0;
    end = n - 1;
    int found = 0;

    while (beg <= end)
    {
        mid = ((beg + end) / 2);

        if (data[mid] == item)
        {
            printf("Item found at index %d\n", mid);
            found = 1;
            break;
        }
        else if (item < data[mid])
            end = mid - 1;
        else
            beg = mid + 1;
    }
    if (!found)
        printf("Item not found in the array. \n");

    return 0;
}