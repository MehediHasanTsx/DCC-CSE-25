#include <stdio.h>
int main()
{

    int n = 5;
    int a[5] = {64, 25, 12, 22, 11};
    int min_index;
    for (int i = 0; i <= n - 1; i++)
    {
        min_index = i;
        for (int j = i + 1; j < n; j++)
        {
            if (a[min_index] > a[j])
            {
                min_index = j;
            }
        }
        if (min_index != i)
        {
            int temp = a[i];
            a[i] = a[min_index];
            a[min_index] = temp;
        }
    }
    printf("Sorted array: \n");
    for (int i = 0; i < n; i++)
    {
        printf("%d ", a[i]);
    }
    return 0;
}

/* With scanf (keyboard input))

#include <stdio.h>
int main()
 {
     int n = 5;
     int a[5];
     printf("Enter number of elements: ");
     for (int i = 0; i < n; i++)
     {
         scanf("%d", &a[i]);
     }
     int min_index;
     for (int i = 0; i < n - 1; i++)
     {
         min_index = i;
         for (int j = i + 1; j < n; j++)
         {
             if (a[j] < a[min_index])
             {
                 min_index = j;
             }
         }
         if (min_index != i)
         {
             int temp = a[i];
             a[i] = a[min_index];
             a[min_index] = temp;
         }
     }
     printf("Sorted array: \n");
     for (int i = 0; i < n; i++)
     {
         printf("%d ", a[i]);
     }
     return 0;
 }
 */