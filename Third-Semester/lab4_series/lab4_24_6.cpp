#include <iostream>
#include <iostream>

double sum = 0.0;
double term = 1.0;
double ratio = 0.25;
int max_terms = 100;

int main()
{
    for (int i = 0; i < max_terms; ++i) /*Sum=a+ar+ar^2+⋯+ar^n−1*/
    {
        sum += term;
        term *= ratio;
    }
    std::cout << "Sum of the series: " << sum << std::endl;
    return 0;
}