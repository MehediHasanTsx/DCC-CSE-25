;Small letter to capital letter

.MODEL SMALL
.STACK 100H
.DATA

.CODE
MEHEDI PROC
    MOV AX, @DATA
    MOV DS, AX

    MOV AH, 01H      ; read small letter
    INT 21H          ; input in AL

    SUB AL, 20H      ; convert to capital
    MOV BL, AL       ; save capital letter

    MOV DL, ' '      ; print space
    MOV AH, 02H
    INT 21H

    MOV DL, BL       ; print capital letter
    MOV AH, 02H
    INT 21H

    MOV AH, 4CH      ; exit
    INT 21H
MEHEDI ENDP
END MEHEDI