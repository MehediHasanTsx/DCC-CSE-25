#include<stdio.h>
int main()
{
    int n = 5;
    int a[5];
    printf("Enter 5 numbers: ");
    scanf("%d %d %d %d %d", &a[0], &a[1], &a[2], &a[3], &a[4]);
    
    int min_index;
    for(int i=0; i<=n-1; i++){
        min_index = i;
        for(int i=0; i<n-1; i++){
            min_index = i;
            for(int j = i+1; j<n; j++){
                if(a[min_index] > a[j]){
                    min_index = j;
                }
            }
            if(min_index != i)
            {
                int temp = a[i];
                a[i] = a[min_index];
                a[min_index] = temp;
            }
        }
        printf("Sorted array: ");
        for(int i = 0; i < n; i++){
            printf("%d ", a[i]);
        }
        return 0;
    }
}