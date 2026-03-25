package com.example.transactions_service.services;
import com.example.transactions_service.models.*;
import com.example.transactions_service.repositories.*;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TransactionService {
    @Autowired
    private   TransactionRepository transactionRepository; 
    

    public List<TransactionModel> getAll(){
        return transactionRepository.findAll(); 
    }
    public TransactionModel saveTransaction(TransactionModel transaction){ 
     return transactionRepository.save(transaction);
    }
    public TransactionModel getById(Long id){
      return  transactionRepository.findById(id).orElse(null); 

     


        }     

        public TransactionModel update(Long id, TransactionModel newDetails){ 
            
            TransactionModel tr = transactionRepository.findById(id).orElse(null); 
            if(tr!=null){ 
                tr.setUserId(newDetails.getUserId());
                tr.setCardId(newDetails.getCardId());
                tr.setAmount(newDetails.getAmount());
                tr.setType(newDetails.getType());
                tr.setCategory(newDetails.getCategory());
                tr.setDescription(newDetails.getDescription());
                tr.setTransactionDate(newDetails.getTransactionDate());
                tr.setUpdatedAt(newDetails.getUpdatedAt());
                return transactionRepository.save(tr);

            }
            return null;
        }

    
}
